/**
 * Microservice: Finance AI Advisor - PRIME OS
 * Analyzes cashflow, purchases, Outlier opportunity cost, and savings targets.
 * Strict professional tone, zero emojis.
 */

class FinanceAIService {
  async advise({ prompt, financeContext = {} }) {
    if (!prompt || typeof prompt !== 'string') {
      return { success: false, error: 'Consulta financiera requerida' };
    }

    const {
      monthlyGoalCOP = 2000000,
      currentSavedCOP = 0,
      totalIncomeCOP = 0,
      totalExpenseCOP = 0,
      outlierHourlyCOP = 60000,
      exchangeRateCOPPerUSD = 4000
    } = financeContext;

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

    if (apiKey) {
      try {
        const geminiRes = await this.queryGemini(prompt, financeContext, apiKey);
        if (geminiRes) {
          return { success: true, provider: 'gemini', advisor: geminiRes };
        }
      } catch (err) {
        console.warn('Fallo consulta Gemini Finance, usando motor local:', err.message);
      }
    }

    const localAdvice = this.evaluateLocalFinance(prompt, financeContext);
    return {
      success: true,
      provider: 'prime-finance-engine',
      advisor: localAdvice
    };
  }

  async queryGemini(prompt, context, apiKey) {
    const systemPrompt = `Eres el Asesor Financiero Inteligente de PRIME OS para Alejo Sierra.
Contexto financiero del usuario:
- Tarifa de trabajo en Outlier: $15 USD por hora.
- Tasa de cambio: ${context.exchangeRateCOPPerUSD || 4000} COP por USD (Equivalente a ${context.outlierHourlyCOP || 60000} COP/hora).
- Meta mensual de ahorro: $${context.monthlyGoalCOP || 2000000} COP.
- Ahorro actual acumulado: $${context.currentSavedCOP || 0} COP.
- Ingresos totales registrados: $${context.totalIncomeCOP || 0} COP.
- Gastos totales registrados: $${context.totalExpenseCOP || 0} COP.

Debes responder ESTRICTAMENTE en formato JSON válido con las siguientes propiedades:
{
  "recommendation": "APROBADO | PRECAUCION | RECHAZAR",
  "summary": "Resumen directo y cuantitativo del veredicto financiero",
  "outlierHoursCost": 0, // Horas de Outlier necesarias para financiar o recuperar el monto si aplica
  "impactOnGoal": "Porcentaje o descripción del impacto sobre la meta de ahorro",
  "actionablePlan": "Instrucción concreta: cuántas horas trabajar o qué ajuste realizar",
  "budgetTip": "Consejo técnico de presupuesto (regla 50/30/20, fondo de emergencia o control de fugas)"
}
REGLA CRÍTICA: NO USES NINGÚN EMOJI en ninguna parte de la respuesta. Cifras exactas y lenguaje profesional y analítico.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nConsulta financiera del usuario: ${prompt}` }]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`Gemini status ${res.status}`);
    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (candidateText) {
      return JSON.parse(candidateText);
    }
    return null;
  }

  evaluateLocalFinance(prompt, context) {
    const {
      monthlyGoalCOP = 2000000,
      currentSavedCOP = 0,
      totalIncomeCOP = 0,
      totalExpenseCOP = 0,
      outlierHourlyCOP = 60000
    } = context;

    // Detect amounts in prompt like "$50.000", "50000", "120k", etc.
    let extractedAmount = 0;
    const cleanNumbers = prompt.replace(/\./g, '').match(/\b\d{3,8}\b/);
    if (cleanNumbers) {
      extractedAmount = parseFloat(cleanNumbers[0]);
    } else {
      const kMatch = prompt.match(/(\d+)\s*k/i);
      if (kMatch) {
        extractedAmount = parseFloat(kMatch[1]) * 1000;
      }
    }

    const hourlyRate = outlierHourlyCOP > 0 ? outlierHourlyCOP : 60000;
    const hoursNeeded = extractedAmount > 0 ? parseFloat((extractedAmount / hourlyRate).toFixed(1)) : 0;
    const remainingToGoal = Math.max(0, monthlyGoalCOP - currentSavedCOP);
    const hoursToCompleteGoal = parseFloat((remainingToGoal / hourlyRate).toFixed(1));
    const netCashflow = totalIncomeCOP - totalExpenseCOP;

    const pLower = prompt.toLowerCase();
    const isInvestment = pLower.includes('tesis') || pLower.includes('estudio') || pLower.includes('salud') || pLower.includes('gym') || pLower.includes('arbitraje');

    let recommendation = 'PRECAUCION';
    if (isInvestment) {
      recommendation = 'APROBADO';
    } else if (extractedAmount > 150000 || (extractedAmount > 0 && extractedAmount > netCashflow * 0.3)) {
      recommendation = 'RECHAZAR';
    }

    return {
      recommendation,
      summary: extractedAmount > 0
        ? `Gasto analizado por $${extractedAmount.toLocaleString('es-CO')} COP. Equivale a ${hoursNeeded} horas de trabajo en Outlier.`
        : `Para completar tu meta de ahorro mensual de $${monthlyGoalCOP.toLocaleString('es-CO')} COP te faltan $${remainingToGoal.toLocaleString('es-CO')} COP (${hoursToCompleteGoal} horas de Outlier).`,
      outlierHoursCost: hoursNeeded,
      impactOnGoal: extractedAmount > 0
        ? `Representa el ${((extractedAmount / monthlyGoalCOP) * 100).toFixed(1)}% de tu meta mensual de ahorro.`
        : `Llevas un cumplimiento del ${Math.round((currentSavedCOP / monthlyGoalCOP) * 100)}% de tu objetivo.`,
      actionablePlan: extractedAmount > 0
        ? `Si decides ejecutar este desembolso, programa un bloque compensatorio de ${Math.ceil(hoursNeeded)} horas en Outlier esta semana.`
        : `Realizando 3 turnos de 3 horas en Outlier acumularías aproximadamente $540.000 COP netos.`,
      budgetTip: `Regla 50/30/20: Reserva 50% para fijos indispensables, 30% para tu meta de ahorro ($2.000.000 COP) y no superes 20% en gastos variables.`
    };
  }
}

module.exports = new FinanceAIService();
