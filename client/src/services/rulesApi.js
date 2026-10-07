/**
 * rulesApi.js — Cliente API para el microservicio de Reglas y Progreso de Estudio
 * Sincroniza el estado de las reglas (no vista, vista, practicada, dominada) entre dispositivos.
 */

const STORAGE_KEY = 'prime_rules_study_progress';

const DEFAULT_PROGRESS = {};
for (let i = 1; i <= 17; i++) {
  DEFAULT_PROGRESS[i] = {
    status: i === 11 ? 'vista' : 'no_vista',
    lastStudied: i === 11 ? new Date().toISOString() : null,
    timesReviewed: i === 11 ? 1 : 0
  };
}

class RulesApiService {
  getFallbackProgress() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return { ...DEFAULT_PROGRESS, ...JSON.parse(stored) };
    } catch (_) {}
    return { ...DEFAULT_PROGRESS };
  }

  saveFallbackProgress(progress) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (_) {}
  }

  async getProgress() {
    try {
      const res = await fetch('/api/rules/progress', {
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.progress) {
          this.saveFallbackProgress(data.progress);
          return data.progress;
        }
      }
    } catch (err) {
      console.warn('Usando progreso offline de reglas:', err.message);
    }
    return this.getFallbackProgress();
  }

  async updateProgress(lawNumber, status) {
    // Actualización optimista local
    const current = this.getFallbackProgress();
    current[lawNumber] = {
      status,
      lastStudied: new Date().toISOString(),
      timesReviewed: ((current[lawNumber] && current[lawNumber].timesReviewed) || 0) + 1
    };
    this.saveFallbackProgress(current);

    try {
      const res = await fetch('/api/rules/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lawNumber, status })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.progress) {
          current[lawNumber] = data.progress;
          this.saveFallbackProgress(current);
        }
      }
    } catch (err) {
      console.warn('Error sincronizando progreso con backend:', err.message);
    }

    return current;
  }
}

export const rulesApi = new RulesApiService();
