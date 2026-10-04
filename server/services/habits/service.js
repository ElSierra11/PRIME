/**
 * Microservice: Habits, Hydration & Duolingo-Style Sleep Alarm Service
 */

const fs = require('fs');
const path = require('path');
const supabase = require('../supabase');

const DATA_FILE = path.join(__dirname, 'habits_data.json');

class HabitsService {
  constructor() {
    this.state = this.loadData();
    this.initialSupabaseLoaded = false;
  }

  loadData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      }
    } catch (e) {
      console.error('Error cargando habits_data.json:', e);
    }
    return {
      water: {
        goalMl: 2500,
        currentMl: 0,
        glassMl: 250,
        lastDrinkTime: new Date().toISOString()
      },
      sleep: {
        targetBedtime: '22:00',
        targetWakeup: '06:30',
        alarmActive: false,
        naggingCount: 0,
        confirmedAsleep: false
      },
      chores: [
        { id: 'ch-1', text: 'Entrenamiento Prime (60m)', done: false, category: 'gym' },
        { id: 'ch-2', text: 'Bloque Outlier (3 a 4 horas)', done: true, category: 'outlier' },
        { id: 'ch-3', text: 'Avance en Trabajo de Grado U', done: true, category: 'thesis' },
        { id: 'ch-4', text: 'Tomar al menos 2.5L de agua', done: false, category: 'health' },
        { id: 'ch-5', text: 'Desconexión de pantallas antes de las 10 PM', done: false, category: 'sleep' }
      ]
    };
  }

  saveData() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.state, null, 2), 'utf8');
    } catch (e) {
      console.error('Error guardando habits_data.json:', e);
    }
  }

  async getHabitsStatus(skipSupabase = false) {
    if (!skipSupabase && supabase.isConfigured() && !this.initialSupabaseLoaded) {
      try {
        const records = await supabase.select('habits_daily', 'id=eq.today');
        if (records && records.length > 0) {
          const r = records[0];
          if (typeof r.water_current_ml === 'number') {
            this.state.water.currentMl = r.water_current_ml;
          }
          if (typeof r.water_goal_ml === 'number') {
            this.state.water.goalMl = r.water_goal_ml;
          }
          if (r.sleep_confirmed !== undefined) {
            this.state.sleep.confirmedAsleep = Boolean(r.sleep_confirmed);
          }
          if (Array.isArray(r.chores) && r.chores.length > 0) {
            this.state.chores = r.chores;
          }
        }
      } catch (e) {
        console.error('Error cargando hábitos desde Supabase:', e.message);
      }
      this.initialSupabaseLoaded = true;
    }

    const currentMl = Math.max(0, Number(this.state.water.currentMl) || 0);
    const goalMl = Math.max(100, Number(this.state.water.goalMl) || 2500);
    const glassMl = Math.max(50, Number(this.state.water.glassMl) || 250);

    // Auto-verify chore ch-4 state consistency
    const waterChore = this.state.chores.find(c => c.id === 'ch-4');
    if (waterChore && currentMl >= goalMl && !waterChore.done) {
      waterChore.done = true;
    }

    const totalChores = this.state.chores.length || 1;
    const completedChores = this.state.chores.filter(c => c.done).length;
    const waterPercent = Math.min(100, Math.round((currentMl / goalMl) * 100));

    // Dynamic Prime Score calculation
    let primeScore = 40;
    primeScore += (completedChores / totalChores) * 40;
    if (waterPercent >= 80) primeScore += 10;
    if (this.state.sleep.confirmedAsleep) primeScore += 10;

    return {
      success: true,
      water: {
        ...this.state.water,
        currentMl,
        goalMl,
        glassMl,
        percent: waterPercent,
        glassesDrank: Math.floor(currentMl / glassMl),
        glassesTotal: Math.floor(goalMl / glassMl)
      },
      sleep: this.state.sleep,
      chores: this.state.chores,
      primeScore: Math.round(primeScore)
    };
  }

  async syncToSupabase() {
    if (supabase.isConfigured()) {
      try {
        await supabase.upsert('habits_daily', {
          id: 'today',
          water_current_ml: Math.max(0, Number(this.state.water.currentMl) || 0),
          water_goal_ml: Math.max(100, Number(this.state.water.goalMl) || 2500),
          sleep_confirmed: Boolean(this.state.sleep.confirmedAsleep),
          sleep_confirmed_at: this.state.sleep.confirmedAsleep ? new Date().toISOString() : null,
          chores: this.state.chores
        });
      } catch (err) {
        console.error('Error sincronizando hábitos a Supabase:', err.message);
      }
    }
  }

  async logWater(amountMl = 250) {
    const amount = Number(amountMl) || 250;
    const cur = Math.max(0, Number(this.state.water.currentMl) || 0);
    this.state.water.currentMl = cur + amount;
    this.state.water.lastDrinkTime = new Date().toISOString();

    // Auto-complete chore ch-4 if goal reached
    const waterChore = this.state.chores.find(c => c.id === 'ch-4');
    if (waterChore && this.state.water.currentMl >= this.state.water.goalMl) {
      waterChore.done = true;
    }

    this.saveData();
    this.syncToSupabase().catch(() => {});
    return this.getHabitsStatus(true);
  }

  async resetWater() {
    this.state.water.currentMl = 0;
    const waterChore = this.state.chores.find(c => c.id === 'ch-4');
    if (waterChore) {
      waterChore.done = false;
    }
    this.saveData();
    this.syncToSupabase().catch(() => {});
    return this.getHabitsStatus(true);
  }

  async toggleChore(choreId) {
    const chore = this.state.chores.find(c => c.id === choreId);
    if (chore) {
      chore.done = !chore.done;
      // If manually marking water chore as done, ensure currentMl reaches goal
      if (chore.id === 'ch-4') {
        if (chore.done && (Number(this.state.water.currentMl) || 0) < this.state.water.goalMl) {
          this.state.water.currentMl = this.state.water.goalMl;
        }
      }
      this.saveData();
      this.syncToSupabase().catch(() => {});
    }
    return this.getHabitsStatus(true);
  }

  async triggerSleepAlarm(isActive = true) {
    this.state.sleep.alarmActive = isActive;
    if (isActive) {
      this.state.sleep.naggingCount++;
      this.state.sleep.confirmedAsleep = false;
    }
    this.saveData();
    this.syncToSupabase().catch(() => {});
    return { success: true, sleep: this.state.sleep };
  }

  async confirmSleep() {
    this.state.sleep.alarmActive = false;
    this.state.sleep.confirmedAsleep = true;
    this.state.sleep.naggingCount = 0;
    this.saveData();
    this.syncToSupabase().catch(() => {});
    return { success: true, sleep: this.state.sleep };
  }
}

module.exports = new HabitsService();
