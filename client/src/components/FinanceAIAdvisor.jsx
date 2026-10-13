import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  Clock,
  Target,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Send,
  HelpCircle,
  ShieldCheck,
  Calculator,
  Compass
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { haptics } from '../utils/haptics';
import { useToast } from '../context/ToastContext';

const QUICK_FINANCE_PROMPTS = [
  {
    label: 'Gasto $120.000 COP',
    prompt: 'Puedo permitirme gastar $120.000 COP en una salida de fin de semana sin retrasar mi meta de $2M?'
  },
  {
    label: 'Horas Outlier para $2M',
    prompt: 'Cuantas horas de Outlier me faltan trabajar para asegurar mi meta mensual de ahorro de $2.000.000 COP?'
  },
  {
    label: 'Presupuesto 50/30/20',
    prompt: 'Analiza la distribucion 50/30/20 con mis ingresos y gastos registrados hasta el momento.'
  },
  {
    label: 'Guayos $250.000 COP',
    prompt: 'Necesito comprar unos guayos de $250.000 COP para los partidos de arbitraje. Es inversion aprobada o gasto de riesgo?'
  }
];

export default function FinanceAIAdvisor({ financeOverview }) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [advisorData, setAdvisorData] = useState(null);

  const handleConsult = async (queryText) => {
    const textToSubmit = queryText || prompt;
    if (!textToSubmit || !textToSubmit.trim()) return;

    try { sounds?.playToastChime?.(); } catch (_) {}
    try { haptics?.impactLight?.(); } catch (_) {}

    setIsLoading(true);
    setAdvisorData(null);

    try {
      const res = await fetch('/api/finance/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSubmit.trim(),
          context: financeOverview || {}
        })
      });

      const data = await res.json();
      if (data.success && data.advisor) {
        setAdvisorData(data.advisor);
        try { sounds?.playSuccessChime?.(); } catch (_) {}
        try { haptics?.seriesDone?.(); } catch (_) {}
      } else {
        toast.error({
          title: 'Error de consulta',
          message: data.error || 'No se pudo generar el consejo financiero.'
        });
      }
    } catch (err) {
      toast.error({
        title: 'Error de red',
        message: 'No fue posible conectar con el asesor financiero.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickClick = (item) => {
    setPrompt(item.prompt);
    handleConsult(item.prompt);
  };

  const getVerdictBadge = (rec) => {
    if (rec === 'APROBADO') {
      return {
        label: 'Inversion Aprobada',
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        icon: CheckCircle2
      };
    }
    if (rec === 'RECHAZAR') {
      return {
        label: 'Gasto No Recomendado',
        color: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        icon: AlertTriangle
      };
    }
    return {
      label: 'Precaucion Requerida',
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      icon: AlertTriangle
    };
  };

  return (
    <div className="space-y-4">
      {/* Input panel */}
      <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-accent-subtle border border-accent/30 flex items-center justify-center text-accent shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-text tracking-tight flex items-center gap-2">
              Asesor Financiero y Costo de Oportunidad
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-accent-subtle text-accent border border-accent/20">
                Auditoria Prime
              </span>
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Consulta si puedes asumir un gasto, evalua el costo en horas de Outlier ($15 USD/h) y asegura tu meta de $2M COP.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleConsult();
          }}
          className="space-y-3"
        >
          <div className="relative">
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Escribe tu duda financiera o monto (ej. Quiero comprar guayos de $220.000 COP, como impacta mi ahorro?)"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-border text-xs sm:text-sm text-text placeholder:text-text-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-none font-sans"
            />
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-[11px] text-text-muted flex items-center gap-1.5 font-medium">
              <Compass className="w-3.5 h-3.5 text-accent" />
              Calculo sincronizado con tu meta de $2.000.000 COP
            </span>

            <div className="flex items-center gap-2">
              {advisorData && (
                <button
                  type="button"
                  onClick={() => {
                    setAdvisorData(null);
                    setPrompt('');
                  }}
                  className="px-3 py-2 rounded-xl bg-surface-2 hover:bg-surface border border-border text-xs font-semibold text-text-muted hover:text-text transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Limpiar
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-black text-xs transition-all shadow-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    Analizando balance...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Auditar Decision
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Quick prompt chips */}
        <div className="mt-3.5 pt-3 border-t border-border">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-2">
            Consultas Rapidas
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {QUICK_FINANCE_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickClick(item)}
                className="px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-accent-subtle/50 hover:text-accent border border-border text-[11px] font-semibold text-text-muted whitespace-nowrap transition-colors shrink-0"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Response Display */}
      <AnimatePresence mode="wait">
        {advisorData && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="p-5 sm:p-6 rounded-2xl bg-surface border border-accent/40 shadow-xs space-y-4"
          >
            {/* Header with verdict */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-muted">Veredicto Financiero:</span>
                {(() => {
                  const b = getVerdictBadge(advisorData.recommendation);
                  const BIcon = b.icon;
                  return (
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase border flex items-center gap-1.5 ${b.color}`}>
                      <BIcon className="w-3.5 h-3.5" />
                      {b.label}
                    </span>
                  );
                })()}
              </div>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-text leading-relaxed">
              {advisorData.summary}
            </p>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {advisorData.outlierHoursCost !== undefined && (
                <div className="p-3.5 rounded-xl bg-surface-2 border border-border space-y-1">
                  <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-accent" />
                    Costo en Turnos Outlier
                  </span>
                  <p className="text-xs font-bold text-text">
                    {advisorData.outlierHoursCost > 0
                      ? `${advisorData.outlierHoursCost} horas de trabajo (~${Math.ceil(advisorData.outlierHoursCost / 3.5)} turnos)`
                      : '0 horas (No requiere compensacion adicional)'}
                  </p>
                </div>
              )}

              {advisorData.impactOnGoal && (
                <div className="p-3.5 rounded-xl bg-surface-2 border border-border space-y-1">
                  <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider flex items-center gap-1.5">
                    <Target className="w-3 h-3 text-warning" />
                    Impacto en Meta de $2M COP
                  </span>
                  <p className="text-xs font-bold text-text">{advisorData.impactOnGoal}</p>
                </div>
              )}
            </div>

            {/* Action plan */}
            {advisorData.actionablePlan && (
              <div className="p-3.5 rounded-xl bg-surface-2/70 border border-border space-y-1">
                <span className="text-[10px] uppercase font-bold text-text flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-accent" />
                  Plan de Accion Inmediato
                </span>
                <p className="text-xs text-text-muted">{advisorData.actionablePlan}</p>
              </div>
            )}

            {/* Budget tip */}
            {advisorData.budgetTip && (
              <div className="p-3 rounded-xl bg-accent-subtle/30 border border-accent/20 flex items-start gap-2.5">
                <DollarSign className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <span className="font-bold text-text">Directriz de Presupuesto 50/30/20:</span>
                  <p className="text-text-muted text-[11px]">{advisorData.budgetTip}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
