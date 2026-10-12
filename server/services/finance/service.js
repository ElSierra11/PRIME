/**
 * Microservice: Finance & Savings Filter Service
 * Provides opportunity cost calculations and savings goal tracking.
 */

const fs = require('fs');
const path = require('path');
const supabase = require('../supabase');

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
    if (supabase.isConfigured()) {
      const goals = await supabase.select('finance_goals', 'id=eq.main');
      if (goals && goals.length > 0) {
        this.state.monthlyGoalCOP = parseFloat(goals[0].monthly_goal_cop);
        this.state.currentSavedCOP = parseFloat(goals[0].current_saved_cop);
        this.state.exchangeRateCOPPerUSD = parseFloat(goals[0].exchange_rate_cop_usd || 4000);
      }
      const savings = await supabase.select('finance_savings', 'order=created_at.desc');
      if (savings && savings.length > 0) {
        this.state.savingsRecords = savings.map(s => {
          const rawAmount = parseFloat(s.amount_cop);
          const isExp = s.type === 'expense' || rawAmount < 0;
          return {
            id: s.id,
            title: s.title,
            amountCOP: Math.abs(rawAmount),
            type: isExp ? 'expense' : 'saving',
            category: s.category || (isExp ? 'gasto' : 'ahorro'),
            date: s.date_label || 'Hoy'
          };
        });
      }
    } else {
      // Normalize existing local records
      if (Array.isArray(this.state.savingsRecords)) {
        this.state.savingsRecords = this.state.savingsRecords.map(r => ({
          ...r,
          type: r.type || (r.id?.startsWith('exp-') || (r.amountCOP < 0) ? 'expense' : 'saving'),
          amountCOP: Math.abs(r.amountCOP || 0),
          category: r.category || (r.type === 'expense' ? 'gasto' : 'ahorro')
        }));
      }
    }

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

  async addSaving({ title, amountCOP, category = 'ahorro', type = 'saving' }) {
    const numericAmount = parseFloat(amountCOP);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return { success: false, error: 'Monto inválido' };
    }

    const isExpense = type === 'expense';
    if (isExpense) {
      this.state.currentSavedCOP = Math.max(0, this.state.currentSavedCOP - numericAmount);
    } else {
      this.state.currentSavedCOP += numericAmount;
    }

    const record = {
      id: (isExpense ? 'exp-' : 'sav-') + Date.now(),
      title: title || (isExpense ? 'Gasto registrado' : 'Ahorro ingresado'),
      amountCOP: numericAmount,
      type: isExpense ? 'expense' : 'saving',
      category: category || (isExpense ? 'gasto' : 'ahorro'),
      date: 'Hoy'
    };
    this.state.savingsRecords.unshift(record);
    this.saveData();

    if (supabase.isConfigured()) {
      await supabase.insert('finance_savings', {
        id: record.id,
        title: record.title,
        amount_cop: isExpense ? -numericAmount : numericAmount,
        category: record.category,
        date_label: record.date
      });
      await supabase.upsert('finance_goals', {
        id: 'main',
        monthly_goal_cop: this.state.monthlyGoalCOP,
        current_saved_cop: this.state.currentSavedCOP,
        exchange_rate_cop_usd: this.state.exchangeRateCOPPerUSD
      });
    }

    return { success: true, record, currentSavedCOP: this.state.currentSavedCOP };
  }

  async addExpense({ title, amountCOP, category = 'gasto' }) {
    return this.addSaving({ title, amountCOP, category, type: 'expense' });
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

    if (supabase.isConfigured()) {
      await supabase.upsert('finance_goals', {
        id: 'main',
        monthly_goal_cop: this.state.monthlyGoalCOP,
        current_saved_cop: this.state.currentSavedCOP,
        exchange_rate_cop_usd: this.state.exchangeRateCOPPerUSD
      });
    }

    return {
      success: true,
      currentSavedCOP: this.state.currentSavedCOP,
      monthlyGoalCOP: this.state.monthlyGoalCOP,
      exchangeRateCOPPerUSD: this.state.exchangeRateCOPPerUSD
    };
  }

  async deleteSaving(id) {
    const prevLen = this.state.savingsRecords.length;
    const target = this.state.savingsRecords.find(r => r.id === id);
    if (target) {
      if (target.type === 'expense') {
        // Revertir gasto: vuelve a sumar al saldo ahorrado
        this.state.currentSavedCOP += target.amountCOP;
      } else {
        // Revertir ahorro: resta del saldo ahorrado
        this.state.currentSavedCOP = Math.max(0, this.state.currentSavedCOP - target.amountCOP);
      }
    }
    this.state.savingsRecords = this.state.savingsRecords.filter(r => r.id !== id);
    this.saveData();

    if (supabase.isConfigured()) {
      await supabase.delete('finance_savings', 'id', id);
      await supabase.upsert('finance_goals', {
        id: 'main',
        monthly_goal_cop: this.state.monthlyGoalCOP,
        current_saved_cop: this.state.currentSavedCOP,
        exchange_rate_cop_usd: this.state.exchangeRateCOPPerUSD
      });
    }

    return {
      success: true,
      deleted: prevLen !== this.state.savingsRecords.length,
      currentSavedCOP: this.state.currentSavedCOP,
      savingsRecords: this.state.savingsRecords
    };
  }
}

module.exports = new FinanceService();
