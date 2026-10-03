/**
 * Microservice: Outlier Tracker Service
 * Manages daily shifts, 3-4 hours target, earnings in USD & COP.
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'outlier_data.json');

class OutlierService {
  constructor() {
    this.state = this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      }
    } catch (e) {
      console.error('Error cargando outlier_data.json:', e);
    }
    return {
      ratePerHourUSD: 15.0,
      dailyTargetHours: 3.5,
      weeklyTargetHours: 20.0,
      sessions: [
        { id: 's-1', date: '2026-10-01', hours: 3.5, earnedUSD: 52.5, notes: 'Anotación y revisión de prompts' },
        { id: 's-2', date: '2026-09-30', hours: 4.0, earnedUSD: 60.0, notes: 'Evaluación técnica de respuestas' }
      ]
    };
  }

  saveData() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.state, null, 2), 'utf8');
    } catch (e) {
      console.error('Error guardando outlier_data.json:', e);
    }
  }

  async getStats() {
    const totalWeeklyHours = this.state.sessions.reduce((acc, s) => acc + s.hours, 0);
    const totalWeeklyUSD = this.state.sessions.reduce((acc, s) => acc + s.earnedUSD, 0);
    const totalWeeklyCOP = totalWeeklyUSD * 4000;

    return {
      success: true,
      ratePerHourUSD: this.state.ratePerHourUSD,
      dailyTargetHours: this.state.dailyTargetHours,
      weeklyTargetHours: this.state.weeklyTargetHours,
      totalWeeklyHours: parseFloat(totalWeeklyHours.toFixed(1)),
      totalWeeklyUSD: parseFloat(totalWeeklyUSD.toFixed(2)),
      totalWeeklyCOP: Math.round(totalWeeklyCOP),
      sessions: this.state.sessions
    };
  }

  async logSession({ hours, notes }) {
    const numericHours = parseFloat(hours);
    const earnedUSD = numericHours * this.state.ratePerHourUSD;
    const session = {
      id: 's-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      hours: numericHours,
      earnedUSD: parseFloat(earnedUSD.toFixed(2)),
      notes: notes || 'Turno completado en Outlier'
    };
    this.state.sessions.unshift(session);
    this.saveData();
    return { success: true, session };
  }

  async updateRate(newRate) {
    this.state.ratePerHourUSD = parseFloat(newRate);
    this.saveData();
    return { success: true, ratePerHourUSD: this.state.ratePerHourUSD };
  }
}

module.exports = new OutlierService();
