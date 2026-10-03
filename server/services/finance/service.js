/**
 * Microservice: Finance & Savings Filter Service
 * Provides opportunity cost calculations and savings goal tracking.
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'finance_data.json');

class FinanceService {
  constructor() {
    this.state = this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      }
    } catch (e) {
      console.error('Error cargando finance_data.json:', e);
    }
    return {
      monthlyGoalCOP: 2000000,
      currentSavedCOP: 1120000,
      exchangeRateCOPPerUSD: 4000,
      savingsRecords: [
        { id: 'sav-1', title: 'Freno en comida rápida en la U', amountCOP: 35000, date: 'Ayer' },
        { id: 'sav-2', title: 'Ahorro de pago partido arbitraje fin de semana', amountCOP: 90000, date: 'Fin de semana' }
      ]
    };
  }

  saveData() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.state, null, 2), 'utf8');
    } catch (e) {
      console.error('Error guardando finance_data.json:', e);
    }
  }

  async getFinanceOverview(ratePerHourUSD = 15) {
    const percent = Math.min(100, Math.round((this.state.currentSavedCOP / this.state.monthlyGoalCOP) * 100));
    return {
      success: true,
      monthlyGoalCOP: this.state.monthlyGoalCOP,
      currentSavedCOP: this.state.currentSavedCOP,
      progressPercent: percent,
      savingsRecords: this.state.savingsRecords,
      outlierHourlyCOP: ratePerHourUSD * this.state.exchangeRateCOPPerUSD
    };
  }

  async evaluateExpense({ name, amountCOP, category, ratePerHourUSD = 15 }) {
    const hourlyRateCOP = ratePerHourUSD * this.state.exchangeRateCOPPerUSD;
    const requiredOutlierHours = parseFloat((amountCOP / hourlyRateCOP).toFixed(1));

    let verdict = 'REJECT';
    let message = '';

    if (category === 'investment') {
      verdict = 'INVESTMENT_APPROVED';
      message = `Inversión recomendada en tu Prime (salud, estudio o tesis). Equivale a ${requiredOutlierHours}h de Outlier.`;
    } else if (category === 'essential') {
      verdict = 'ESSENTIAL_APPROVED';
      message = `Gasto indispensable. Equivale a ${requiredOutlierHours}h de Outlier. Mantén vigilados los no esenciales.`;
    } else {
      verdict = 'AVOID_IMPULSE';
      message = `¡Cuidado! Este antojo te cuesta trabajar ${requiredOutlierHours} HORAS en Outlier. ¿Vale la pena sacrificar ese tiempo?`;
    }

    return {
      success: true,
      name,
      amountCOP: parseFloat(amountCOP),
      category,
      requiredOutlierHours,
      verdict,
      message
    };
  }

  async addSaving({ title, amountCOP }) {
    const numericAmount = parseFloat(amountCOP);
    this.state.currentSavedCOP += numericAmount;
    const record = {
      id: 'sav-' + Date.now(),
      title,
      amountCOP: numericAmount,
      date: 'Hoy'
    };
    this.state.savingsRecords.unshift(record);
    this.saveData();
    return { success: true, record, currentSavedCOP: this.state.currentSavedCOP };
  }

  async updateGoals({ currentSavedCOP, monthlyGoalCOP, exchangeRateCOPPerUSD }) {
    if (currentSavedCOP !== undefined && !isNaN(Number(currentSavedCOP))) {
      this.state.currentSavedCOP = Math.max(0, parseFloat(currentSavedCOP));
    }
    if (monthlyGoalCOP !== undefined && !isNaN(Number(monthlyGoalCOP))) {
      this.state.monthlyGoalCOP = Math.max(1, parseFloat(monthlyGoalCOP));
    }
    if (exchangeRateCOPPerUSD !== undefined && !isNaN(Number(exchangeRateCOPPerUSD))) {
      this.state.exchangeRateCOPPerUSD = Math.max(1, parseFloat(exchangeRateCOPPerUSD));
    }
    this.saveData();
    return {
      success: true,
      currentSavedCOP: this.state.currentSavedCOP,
      monthlyGoalCOP: this.state.monthlyGoalCOP,
      exchangeRateCOPPerUSD: this.state.exchangeRateCOPPerUSD
    };
  }

  async deleteSaving(id) {
    const prevLen = this.state.savingsRecords.length;
    this.state.savingsRecords = this.state.savingsRecords.filter(r => r.id !== id);
    this.saveData();
    return {
      success: true,
      deleted: prevLen !== this.state.savingsRecords.length,
      currentSavedCOP: this.state.currentSavedCOP,
      savingsRecords: this.state.savingsRecords
    };
  }
}

module.exports = new FinanceService();
