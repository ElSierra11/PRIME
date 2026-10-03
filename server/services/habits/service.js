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
        currentMl: 1250,
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

  async getHabitsStatus() {
    if (supabase.isConfigured()) {
      const records = await supabase.select('habits_daily', 'id=eq.today');
      if (records && records.length > 0) {
        const r = records[0];
        this.state.water.currentMl = r.water_current_ml ?? this.state.water.currentMl;
        this.state.water.goalMl = r.water_goal_ml ?? this.state.water.goalMl;
        this.state.sleep.confirmedAsleep = Boolean(r.sleep_confirmed);
        if (Array.isArray(r.chores) && r.chores.length > 0) {
          this.state.chores = r.chores;
        }
      }
    }

    const totalChores = this.state.chores.length;
    const completedChores = this.state.chores.filter(c => c.done).length;
    const waterPercent = Math.min(100, Math.round((this.state.water.currentMl / this.state.water.goalMl) * 100));

    // Dynamic Prime Score calculation
    let primeScore = 40;
    primeScore += (completedChores / totalChores) * 40;
    if (waterPercent >= 80) primeScore += 10;
    if (this.state.sleep.confirmedAsleep) primeScore += 10;

    return {
      success: true,
      water: {
        ...this.state.water,
        percent: waterPercent,
        glassesDrank: Math.floor(this.state.water.currentMl / this.state.water.glassMl),
        glassesTotal: Math.floor(this.state.water.goalMl / this.state.water.glassMl)
      },
      sleep: this.state.sleep,
      chores: this.state.chores,
      primeScore: Math.round(primeScore)
    };
  }

  async syncToSupabase() {
    if (supabase.isConfigured()) {
      await supabase.upsert('habits_daily', {
        id: 'today',
        water_current_ml: this.state.water.currentMl,
        water_goal_ml: this.state.water.goalMl,
        sleep_confirmed: this.state.sleep.confirmedAsleep,
        sleep_confirmed_at: this.state.sleep.confirmedAsleep ? new Date().toISOString() : null,
        chores: this.state.chores
      });
    }
  }

  async logWater(amountMl = 250) {
    this.state.water.currentMl += amountMl;
    this.state.water.lastDrinkTime = new Date().toISOString();
    this.saveData();
    await this.syncToSupabase();
    return this.getHabitsStatus();
  }

  async resetWater() {
    this.state.water.currentMl = 0;
    this.saveData();
    await this.syncToSupabase();
    return this.getHabitsStatus();
  }

  async toggleChore(choreId) {
    const chore = this.state.chores.find(c => c.id === choreId);
    if (chore) {
      chore.done = !chore.done;
      this.saveData();
      await this.syncToSupabase();
    }
    return this.getHabitsStatus();
  }

  async triggerSleepAlarm(isActive = true) {
    this.state.sleep.alarmActive = isActive;
    if (isActive) {
      this.state.sleep.naggingCount++;
      this.state.sleep.confirmedAsleep = false;
    }
    this.saveData();
    await this.syncToSupabase();
    return { success: true, sleep: this.state.sleep };
  }

  async confirmSleep() {
    this.state.sleep.alarmActive = false;
    this.state.sleep.confirmedAsleep = true;
    this.state.sleep.naggingCount = 0;
    this.saveData();
    await this.syncToSupabase();
    return { success: true, sleep: this.state.sleep };
  }
}

module.exports = new HabitsService();
