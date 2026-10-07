/**
 * Microservice: Rules & Study Progress Engine (PRIME OS)
 * Gestiona el contenido de estudio de las 17 Reglas IFAB 2026/27,
 * el estado de auditoría y la sincronización del progreso de estudio del árbitro.
 */

const fs = require('fs');
const path = require('path');
const supabase = require('../supabase');

const DATA_FILE = path.join(__dirname, 'rules_data.json');

const INITIAL_PROGRESS = {};
for (let i = 1; i <= 17; i++) {
  INITIAL_PROGRESS[i] = {
    status: i === 11 ? 'vista' : 'no_vista', // Regla 11 vista por defecto en onboarding
    lastStudied: i === 11 ? new Date().toISOString() : null,
    timesReviewed: i === 11 ? 1 : 0
  };
}

class RulesService {
  constructor() {
    this.state = this.loadData();
    this.initialSupabaseLoaded = false;
  }

  loadData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        return {
          progress: { ...INITIAL_PROGRESS, ...(parsed.progress || {}) },
          notes: parsed.notes || {}
        };
      }
    } catch (e) {
      console.error('Error cargando rules_data.json:', e);
    }
    return {
      progress: { ...INITIAL_PROGRESS },
      notes: {}
    };
  }

  saveData() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.state, null, 2), 'utf8');
    } catch (e) {
      console.error('Error guardando rules_data.json:', e);
    }
  }

  async getProgress(skipSupabase = false) {
    if (!skipSupabase && supabase.isConfigured() && !this.initialSupabaseLoaded) {
      try {
        const records = await supabase.select('rules_progress', 'id=eq.user_main');
        if (records && records.length > 0 && records[0].data) {
          this.state.progress = { ...this.state.progress, ...records[0].data };
          this.saveData();
          this.initialSupabaseLoaded = true;
        }
      } catch (err) {
        console.warn('Fallo sync Supabase en rules progress, usando cache local:', err.message);
      }
    }

    return {
      success: true,
      progress: this.state.progress,
      lastUpdated: new Date().toISOString()
    };
  }

  async updateRuleProgress(lawNumber, newStatus) {
    const num = parseInt(lawNumber, 10);
    if (isNaN(num) || num < 1 || num > 17) {
      return { success: false, error: 'Número de regla inválido (1-17)' };
    }

    const current = this.state.progress[num] || {
      status: 'no_vista',
      lastStudied: null,
      timesReviewed: 0
    };

    const validStatuses = ['no_vista', 'vista', 'practicada', 'dominada'];
    const statusToSet = validStatuses.includes(newStatus) ? newStatus : 'vista';

    this.state.progress[num] = {
      status: statusToSet,
      lastStudied: new Date().toISOString(),
      timesReviewed: (current.timesReviewed || 0) + 1
    };

    this.saveData();

    if (supabase.isConfigured()) {
      try {
        await supabase.upsert('rules_progress', {
          id: 'user_main',
          data: this.state.progress,
          updated_at: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Error sincronizando rules_progress con Supabase:', e.message);
      }
    }

    return {
      success: true,
      ruleNumber: num,
      progress: this.state.progress[num]
    };
  }

  async resetAllProgress() {
    this.state.progress = { ...INITIAL_PROGRESS };
    this.saveData();
    return { success: true, progress: this.state.progress };
  }
}

module.exports = new RulesService();
