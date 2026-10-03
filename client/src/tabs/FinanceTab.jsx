import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  PiggyBank,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Laptop,
  Shield,
  X,
  TrendingUp,
  Clock,
  ChevronRight,
  Trophy,
  Zap,
  DollarSign,
  Edit3,
  Trash2,
  Plus,
  Minus,
  Save
} from 'lucide-react';
import { sounds } from '../utils/audio';
import AnimatedNumber from '../components/AnimatedNumber';
import { useToast } from '../hooks/useToast';

/* ─── confetti helper ──────────────────────────────────── */
async function launchConfetti() {
  try {
    const confetti = (await import('canvas-confetti')).default;
    confetti({ particleCount: 110, spread: 80, origin: { x: 0.5, y: 0.45 },
      colors: ['#38bdf8', '#34d399', '#818cf8', '#facc15', '#f472b6'] });
  } catch (_) {}
}

/* ─── Helpers ───────────────────────────────────────────── */
const formatCOP = (val) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

const formatShortCOP = (val) => {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${Math.round(val / 1_000)}k`;
  return `$${val}`;
};

/* ─── SVG Savings Chart ────────────────────────────────── */
function SavingsChart({ records, goalCOP }) {
  const W = 400, H = 140, PAD = { top: 16, right: 16, bottom: 28, left: 48 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  // Build cumulative savings points from records sorted by date
  const points = useMemo(() => {
    if (!records || records.length === 0) return [];
    const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
    let cumulative = 0;
    return sorted.map((r, i) => {
      cumulative += r.amountCOP || 0;
      return { x: i, y: cumulative, label: r.date, amount: cumulative };
    });
  }, [records]);

  if (points.length < 2) {
    return (
      <div className="flex items-center justify-center h-[140px] text-xs text-text-muted italic">
        Registra victorias de ahorro para ver tu gráfica.
      </div>
    );
  }

  const maxY = Math.max(goalCOP, ...points.map(p => p.y));
  const xScale = (i) => PAD.left + (i / (points.length - 1)) * innerW;
  const yScale = (v) => PAD.top + innerH - (v / maxY) * innerH;

  // Build SVG path
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(p.y).toFixed(1)}`)
    .join(' ');

  const areaD = `${pathD} L ${xScale(points.length - 1).toFixed(1)} ${(PAD.top + innerH).toFixed(1)} L ${xScale(0).toFixed(1)} ${(PAD.top + innerH).toFixed(1)} Z`;

  const goalY = yScale(goalCOP);

  // Y-axis labels
  const yTicks = [0, goalCOP * 0.5, goalCOP, maxY].filter((v, i, a) => a.indexOf(v) === i && v <= maxY);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} aria-label="Gráfica de ahorro acumulado" role="img" className="overflow-visible">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-success, #34d399)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-success, #34d399)" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line
            x1={PAD.left} y1={yScale(v).toFixed(1)}
            x2={W - PAD.right} y2={yScale(v).toFixed(1)}
            stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4"
            className="text-border"
          />
          <text
            x={PAD.left - 4} y={yScale(v) + 4}
            textAnchor="end" fontSize="9"
            className="fill-current text-text-muted" fill="currentColor"
            style={{ fill: 'var(--color-text-muted, #94a3b8)' }}
          >
            {formatShortCOP(v)}
          </text>
        </g>
      ))}

      {/* Goal line */}
      <line
        x1={PAD.left} y1={goalY.toFixed(1)}
        x2={W - PAD.right} y2={goalY.toFixed(1)}
        stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 3"
        className="text-accent"
        style={{ stroke: 'var(--color-accent, #38bdf8)' }}
      />
      <text x={W - PAD.right + 2} y={goalY - 3} fontSize="9" style={{ fill: 'var(--color-accent, #38bdf8)' }}>
        Meta
      </text>

      {/* Area fill */}
      <path d={areaD} fill="url(#areaGrad)" />

      {/* Line */}
      <motion.path
        d={pathD}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-success"
        style={{ stroke: 'var(--color-success, #34d399)' }}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      {/* Data points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={xScale(i).toFixed(1)}
          cy={yScale(p.y).toFixed(1)}
          r="4"
          fill="var(--color-success, #34d399)"
          stroke="var(--color-surface, #fff)"
          strokeWidth="2"
        />
      ))}

      {/* X-axis labels (first and last) */}
      {[0, points.length - 1].map((i) => (
        <text
          key={i}
          x={xScale(i)}
          y={H - 4}
          textAnchor={i === 0 ? 'start' : 'end'}
          fontSize="9"
          style={{ fill: 'var(--color-text-muted, #94a3b8)' }}
        >
          {points[i]?.label || ''}
        </text>
      ))}
    </svg>
  );
}

/* ─── Verdict animation variants ────────────────────────── */
const verdictVariants = {
  CAN: {
    animate: { scale: [0.8, 1.08, 1], opacity: [0, 1, 1] },
    transition: { duration: 0.45, ease: 'easeOut' }
  },
  CANNOT: {
    animate: { x: [0, -8, 8, -6, 6, -3, 3, 0], scale: [0.9, 1], opacity: [0, 1, 1] },
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

/* ─── Main Component ────────────────────────────────────── */
export default function FinanceTab({
  financeOverview,
  onEvaluateExpense,
  onAddSaving,
  onUpdateGoals,
  onDeleteSaving,
  addToast: legacyAddToast
}) {
  const { toast } = useToast();
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('impulse');
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [goalReached, setGoalReached] = useState(false);
  const [isEditGoalsModalOpen, setIsEditGoalsModalOpen] = useState(false);
  const [editSavedInput, setEditSavedInput] = useState('');
  const [editGoalInput, setEditGoalInput] = useState('');
  const [isSavingGoals, setIsSavingGoals] = useState(false);
  const drawerRef = useRef(null);

  /* ─── Data ── */
  const goalCOP = financeOverview?.monthlyGoalCOP || 2_000_000;
  const currentSaved = financeOverview?.currentSavedCOP || 1_120_000;
  const percent = Math.min(100, Math.round((currentSaved / goalCOP) * 100));
  const progressFraction = Math.min(1, currentSaved / goalCOP);
  const ratePerHour = financeOverview?.outlierRateUSD || 15;
  const COP_RATE = 4000;
  const records = financeOverview?.savingsRecords || [];

  const handleSaveGoals = async (e) => {
    e.preventDefault();
    const newSaved = parseFloat(editSavedInput);
    const newGoal = parseFloat(editGoalInput);
    if (isNaN(newSaved) || isNaN(newGoal)) return;

    setIsSavingGoals(true);
    try {
      if (onUpdateGoals) {
        await onUpdateGoals({ currentSavedCOP: newSaved, monthlyGoalCOP: newGoal });
      }
      sounds.playSuccessChime();
      toast.success({
        title: 'Metas actualizadas',
        message: 'Tus metas de ahorro han sido guardadas correctamente.',
        category: 'finance'
      });
      setIsEditGoalsModalOpen(false);
    } finally {
      setIsSavingGoals(false);
    }
  };

  /* ─── Goal confetti (once) ── */
  useEffect(() => {
    if (percent >= 100 && !goalReached) {
      setGoalReached(true);
      launchConfetti();
      toast.achievement({
        title: '¡Meta de ahorro alcanzada!',
        message: '¡$2M COP! Eres un animal de las finanzas Prime.',
        category: 'finance'
      });
    }
  }, [percent, goalReached, toast]);

  /* ─── Drawer esc close ── */
  useEffect(() => {
    if (!isDrawerOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setIsDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isDrawerOpen]);

  /* ─── Evaluate handler ── */
  const handleEvaluate = async (e) => {
    e.preventDefault();
    const amount = parseFloat(expenseAmount);
    if (!expenseName.trim() || !amount) return;
    setIsEvaluating(true);
    try {
      const res = await onEvaluateExpense({ name: expenseName.trim(), amountCOP: amount, category: expenseCategory });
      if (res?.success) {
        setEvaluationResult(res);
        sounds.playToastChime();
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  /* ─── Save handler ── */
  const handleChooseToSave = () => {
    if (!evaluationResult) return;
    onAddSaving({ title: `Ahorrado: ${evaluationResult.name}`, amountCOP: evaluationResult.amountCOP });
    sounds.playSuccessChime();
    toast.success({
      title: 'Decisión Prime Registrada',
      message: `+${formatCOP(evaluationResult.amountCOP)} sumados a tu meta mensual.`,
      category: 'finance'
    });
    setEvaluationResult(null);
    setExpenseName('');
    setExpenseAmount('');
  };

  /* ─── Derived values for evaluationResult ── */
  const verdictIsGood = evaluationResult && evaluationResult.verdict !== 'AVOID_IMPULSE';
  const outlierHoursNeeded = evaluationResult
    ? (parseFloat(evaluationResult.amountCOP) / (ratePerHour * COP_RATE)).toFixed(1)
    : null;

  /* ─── Preview Outlier hours cost in real-time while typing ── */
  const previewHours = useMemo(() => {
    const v = parseFloat(expenseAmount);
    if (!v || v <= 0) return null;
    return (v / (ratePerHour * COP_RATE)).toFixed(1);
  }, [expenseAmount, ratePerHour]);

  /* ─── Bar color ── */
  const barColor = percent >= 100 ? 'bg-success' : percent >= 75 ? 'bg-accent' : percent >= 50 ? 'bg-accent' : 'bg-warning';

  const displayRecords = records.slice(0, 3);

  /* ─── Render ─────────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* ── Hero: Goal Progress Bar ─────────────────────── */}
      <section
        aria-labelledby="finance-heading"
        className="bg-surface border border-border p-5 sm:p-7 rounded-2xl shadow-xs space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-subtle text-accent text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" /> EL FILTRO PRIME DE GASTOS
            </div>
            <h1 id="finance-heading" className="text-xl sm:text-2xl font-extrabold text-text tracking-tight">
              Finanzas y Control de Gastos
            </h1>
            <p className="text-xs text-text-muted mt-0.5 leading-relaxed max-w-lg">
              Cada gasto evaluado en horas de Outlier. Meta mensual: ahorrar <strong>$2M COP</strong> mientras avanzas en la U y el arbitraje.
            </p>
          </div>

          {/* Saved amount chip */}
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[11px] text-text-muted font-bold uppercase tracking-wide">Ahorrado este mes</span>
            <span className="font-mono text-3xl font-black text-text tabular-nums leading-tight mt-0.5">
              <AnimatedNumber value={currentSaved} format="cop" duration={1000} className="text-text" />
            </span>
            <span className="text-[11px] text-text-muted font-mono tabular-nums">
              de {formatCOP(goalCOP)} ({percent}%)
            </span>
            <button
              type="button"
              onClick={() => {
                setEditSavedInput(String(currentSaved));
                setEditGoalInput(String(goalCOP));
                setIsEditGoalsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-subtle hover:bg-accent/20 border border-accent/30 text-xs font-bold text-accent transition-colors mt-2 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              title="Modificar cuánto tengo ahorrado actualmente y meta mensual"
            >
              <Edit3 className="w-3.5 h-3.5 text-accent" />
              Modificar Ahorro / Meta
            </button>
          </div>
        </div>

        {/* Big progress bar with animated fill */}
        <div className="space-y-2">
          <div className="relative w-full h-5 bg-surface-2 rounded-full overflow-hidden border border-border">
            <motion.div
              role="progressbar"
              aria-label="Progreso hacia la meta mensual de ahorro de $2M COP"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              className={`h-full rounded-full ${barColor} relative overflow-hidden`}
              initial={{ width: 0 }}
              animate={{ width: `${progressFraction * 100}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            >
              {/* Shimmer overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_ease-in-out_infinite]" />
            </motion.div>
            {/* % label inside bar if wide enough */}
            {percent > 15 && (
              <span className="absolute inset-0 flex items-center pl-3 text-[10px] font-black text-slate-950 tabular-nums">
                {percent}%
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-text-muted font-mono tabular-nums">
            <span>$0</span>
            <span className="text-accent font-bold">$1M</span>
            <span>Meta: {formatCOP(goalCOP)}</span>
          </div>
        </div>

        {/* Income streams row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-2 border border-border">
            <Laptop className="w-4 h-4 text-accent shrink-0" />
            <div>
              <span className="text-[10px] font-black text-text-muted uppercase block">Outlier</span>
              <span className="text-xs font-bold text-text">${ratePerHour} USD/h · 3–4h diarias</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-2 border border-border">
            <Shield className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <span className="text-[10px] font-black text-text-muted uppercase block">Arbitraje</span>
              <span className="text-xs font-bold text-text">Por partido · COARC</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Expense Auditor ────────────────────────────── */}
        <section
          aria-labelledby="evaluator-heading"
          className="bg-surface border border-border p-5 sm:p-6 rounded-2xl space-y-5 shadow-xs"
        >
          <div className="border-b border-border pb-3">
            <h2 id="evaluator-heading" className="text-base font-bold text-text flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-accent" /> Auditor de Costo de Oportunidad
            </h2>
            <p className="text-xs text-text-muted mt-0.5">¿Puedo o no puedo permitirme este gasto?</p>
          </div>

          <form onSubmit={handleEvaluate} className="space-y-4">
            <div>
              <label htmlFor="expense-name-input" className="text-xs font-bold text-text block mb-1.5">
                ¿En qué quieres gastar?
              </label>
              <input
                id="expense-name-input"
                type="text"
                placeholder="Ej. Tenis nuevos, domicilio, salida..."
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                required
                className="w-full px-3.5 py-3 rounded-xl bg-surface-2 border-2 border-border hover:border-accent/40 text-text placeholder:text-text-muted text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent min-h-[48px] transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="expense-amount-input" className="text-xs font-bold text-text block mb-1.5">
                  Monto ($ COP):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted font-mono text-sm font-bold">$</span>
                  <input
                    id="expense-amount-input"
                    type="number"
                    placeholder="65000"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    required
                    min="1000"
                    step="1000"
                    className="w-full pl-8 pr-3.5 py-3 rounded-xl bg-surface-2 border-2 border-border hover:border-accent/40 text-text placeholder:text-text-muted text-sm font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent min-h-[48px] transition-colors"
                  />
                </div>
                {/* Live Outlier hours preview */}
                {previewHours && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[11px] text-warning font-bold mt-1.5 flex items-center gap-1"
                  >
                    <Clock className="w-3 h-3" />
                    Te costaría <span className="font-mono">{previewHours}h</span> de trabajo en Outlier
                  </motion.p>
                )}
              </div>

              <div>
                <label htmlFor="expense-category-select" className="text-xs font-bold text-text block mb-1.5">
                  Categoría:
                </label>
                <select
                  id="expense-category-select"
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl bg-surface-2 border-2 border-border hover:border-accent/40 text-text text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent min-h-[48px] transition-colors"
                >
                  <option value="impulse">Antojo / Impulsivo</option>
                  <option value="food">Comida fuera de casa</option>
                  <option value="social">Salida Social</option>
                  <option value="investment">Inversión Prime (Estudio/Salud)</option>
                  <option value="essential">Gasto Fijo Esencial</option>
                </select>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isEvaluating}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3.5 px-5 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-black text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[50px] disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
            >
              {isEvaluating ? 'Evaluando...' : 'Evaluar Impacto en mi Prime'}
            </motion.button>
          </form>

          {/* ── Verdict Panel ── */}
          <AnimatePresence mode="wait">
            {evaluationResult && (
              <motion.div
                key={evaluationResult.name + evaluationResult.amountCOP}
                role="region"
                aria-label="Resultado de evaluación de gasto"
                {...(verdictIsGood ? verdictVariants.CAN : verdictVariants.CANNOT)}
                className={`p-4 sm:p-5 rounded-2xl border-2 space-y-3 ${
                  verdictIsGood
                    ? 'bg-success-subtle border-success/50 shadow-[0_0_20px_rgba(52,211,153,0.15)]'
                    : 'bg-danger/5 border-danger/40 shadow-[0_0_20px_rgba(239,68,68,0.12)]'
                }`}
              >
                {/* Big verdict label */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {verdictIsGood
                      ? <CheckCircle className="w-6 h-6 text-success shrink-0" />
                      : <AlertTriangle className="w-6 h-6 text-danger shrink-0" />
                    }
                    <div>
                      <span className={`text-xl font-black block leading-tight ${verdictIsGood ? 'text-success' : 'text-danger'}`}>
                        {verdictIsGood ? '¡Puedes! ✓' : 'Mejor no ✗'}
                      </span>
                      <span className="text-[11px] text-text-muted font-bold">
                        {verdictIsGood ? 'Gasto Justificado' : 'Gasto Prescindible'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setEvaluationResult(null)}
                    aria-label="Cerrar veredicto"
                    className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Outlier hours cost — central metric */}
                <div className={`p-3 rounded-xl text-center border ${verdictIsGood ? 'bg-success/10 border-success/30' : 'bg-danger/5 border-danger/20'}`}>
                  <p className="text-[11px] text-text-muted font-bold mb-0.5">Costo en horas de Outlier</p>
                  <span className="font-mono font-black tabular-nums text-text" style={{ fontSize: '1.6rem' }}>
                    {outlierHoursNeeded}h
                  </span>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    = {formatCOP(evaluationResult.amountCOP)} ÷ ${ratePerHour}/h × $4,000 COP
                  </p>
                </div>

                {/* Service message */}
                <p className="text-xs text-text-muted leading-relaxed">{evaluationResult.message}</p>

                {/* Action buttons */}
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    onClick={handleChooseToSave}
                    className="flex-1 py-3 px-4 rounded-xl bg-success hover:opacity-90 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success shadow-xs active:scale-[0.97]"
                  >
                    <PiggyBank className="w-4 h-4" /> Decido Ahorrarlo
                  </button>
                  <button
                    onClick={() => setEvaluationResult(null)}
                    className="py-3 px-4 rounded-xl bg-surface hover:bg-surface-2 text-text-muted hover:text-text border-2 border-border text-xs font-semibold transition-colors min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Descartar
                  </button>
                </div>
              </motion.div>
            )}

            {/* Placeholder when no result */}
            {!evaluationResult && (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-8 gap-2 text-text-muted border-2 border-dashed border-border rounded-2xl"
              >
                <HelpCircle className="w-8 h-8 opacity-30" />
                <p className="text-xs font-medium text-center max-w-[180px]">
                  El veredicto "¿Puedo o no puedo?" aparecerá aquí.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── Right Column: Chart + Victories ────────────── */}
        <div className="space-y-6">

          {/* SVG Savings Chart */}
          <section
            aria-labelledby="savings-chart-heading"
            className="bg-surface border border-border p-5 rounded-2xl shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 id="savings-chart-heading" className="text-sm font-bold text-text flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success" /> Curva de Ahorro Acumulado
              </h2>
              {percent >= 100 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/15 text-success text-[10px] font-black">
                  <Trophy className="w-3 h-3" /> Meta alcanzada
                </span>
              )}
            </div>

            <SavingsChart records={records} goalCOP={goalCOP} />

            {/* Quick stat row below chart */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border">
              {[
                { label: 'Ahorrado', value: formatShortCOP(currentSaved), color: 'text-success' },
                { label: 'Restante', value: formatShortCOP(Math.max(0, goalCOP - currentSaved)), color: 'text-warning' },
                { label: 'Avance', value: `${percent}%`, color: 'text-accent' }
              ].map((stat) => (
                <div key={stat.label} className="text-center p-2 rounded-xl bg-surface-2 border border-border">
                  <span className={`font-mono font-black text-sm tabular-nums ${stat.color}`}>{stat.value}</span>
                  <span className="text-[10px] text-text-muted block">{stat.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Savings Victories */}
          <section
            aria-labelledby="victories-heading"
            className="bg-surface border border-border p-5 rounded-2xl shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 id="victories-heading" className="text-sm font-bold text-text flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" /> Victorias de Ahorro
              </h2>
              {records.length > 3 && (
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="text-xs font-bold text-accent hover:text-accent-hover flex items-center gap-1 min-h-[36px] transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  Ver todas ({records.length}) <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {records.length === 0 ? (
              <div className="py-6 text-center text-xs text-text-muted italic">
                Tus victorias de ahorro aparecerán aquí cuando evalúes y decidas no gastar.
              </div>
            ) : (
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
                className="space-y-2"
              >
                {displayRecords.map((rec, i) => (
                  <motion.div
                    key={rec.id || i}
                    variants={{
                      hidden: { opacity: 0, x: -12 },
                      show: { opacity: 1, x: 0, transition: { duration: 0.22, ease: 'easeOut' } }
                    }}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-surface-2 border border-border hover:border-success/30 hover:bg-success/5 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                        <PiggyBank className="w-4 h-4 text-success" />
                      </span>
                      <div className="min-w-0">
                        <span className="font-bold text-text text-xs block truncate">{rec.title}</span>
                        <span className="text-[11px] text-text-muted font-mono">{rec.date}</span>
                      </div>
                    </div>
                    <span className="font-mono font-black text-success tabular-nums text-xs shrink-0 ml-2">
                      +{formatCOP(rec.amountCOP)}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {records.length > 3 && (
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-border hover:border-accent/40 text-xs font-bold text-text-muted hover:text-accent transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Ver todas las victorias ({records.length}) →
              </button>
            )}
          </section>
        </div>
      </div>

      {/* ── Drawer: All Victories ───────────────────────── */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Slide-up Drawer */}
            <motion.aside
              key="drawer"
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="drawer-heading"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 38 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] bg-surface border-t border-border rounded-t-3xl shadow-2xl flex flex-col"
            >
              {/* Drawer handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
                <h2 id="drawer-heading" className="text-base font-black text-text flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-accent" />
                  Todas las Victorias de Ahorro ({records.length})
                </h2>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label="Cerrar panel de victorias"
                  className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-surface-2 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer total */}
              <div className="px-5 py-3 bg-success-subtle border-b border-success/20 shrink-0">
                <span className="text-xs text-text-muted font-bold">Total ahorrado mediante decisiones Prime:</span>
                <span className="font-mono font-black text-success text-lg tabular-nums ml-2">
                  {formatCOP(records.reduce((s, r) => s + (r.amountCOP || 0), 0))}
                </span>
              </div>

              {/* Scrollable list — no nested scroll, drawer IS the scroll container */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 pb-safe">
                {records.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-8 italic">Sin victorias registradas todavía.</p>
                ) : (
                  records.map((rec, i) => (
                    <div
                      key={rec.id || i}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-surface-2 border border-border"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-success/15 flex items-center justify-center shrink-0 text-xs font-black text-success">
                          #{i + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="font-bold text-text text-xs block">{rec.title}</span>
                          <span className="text-[11px] text-text-muted font-mono">{rec.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="font-mono font-black text-success tabular-nums text-xs">
                          +{formatCOP(rec.amountCOP)}
                        </span>
                        {onDeleteSaving && (
                          <button
                            type="button"
                            onClick={() => onDeleteSaving(rec.id)}
                            className="p-1.5 text-text-muted hover:text-danger rounded-lg hover:bg-danger-subtle/30 transition-colors"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ─── Modal para Modificar Ahorro Actual y Metas ─── */}
      {isEditGoalsModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-savings-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditGoalsModalOpen(false);
          }}
        >
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-text animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-surface-2/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent-subtle border border-accent/30 flex items-center justify-center text-accent">
                  <PiggyBank className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="edit-savings-title" className="text-base font-extrabold text-text">
                    Modificar Saldo Ahorrado & Meta
                  </h3>
                  <p className="text-xs text-text-muted">
                    Actualiza tu balance real y ajusta tu objetivo mensual en COP.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditGoalsModalOpen(false)}
                aria-label="Cerrar modal"
                className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-surface-2 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveGoals} className="p-5 sm:p-6 space-y-5">
              {/* Field 1: Saldo Ahorrado Actual */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="edit-saved-amount" className="text-xs font-bold text-text">
                    ¿Cuánto tienes ahorrado actualmente? ($ COP):
                  </label>
                  <span className="font-mono text-xs font-black text-accent tabular-nums">
                    {formatCOP(parseFloat(editSavedInput) || 0)}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted font-bold text-sm">$</span>
                  <input
                    id="edit-saved-amount"
                    type="number"
                    min="0"
                    step="1000"
                    value={editSavedInput}
                    onChange={(e) => setEditSavedInput(e.target.value)}
                    required
                    placeholder="Ej. 1200000"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-surface-2 border border-border text-text text-sm font-mono font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  />
                </div>

                {/* Quick Delta Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-text-muted font-bold mr-1 uppercase">Ajuste rápido:</span>
                  {[
                    { label: '+50k', val: 50000 },
                    { label: '+100k', val: 100000 },
                    { label: '+200k', val: 200000 },
                    { label: '+500k', val: 500000 },
                    { label: '-50k', val: -50000 }
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        const currentVal = parseFloat(editSavedInput) || 0;
                        setEditSavedInput(String(Math.max(0, currentVal + chip.val)));
                      }}
                      className="px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface border border-border text-[11px] font-bold text-text transition-colors min-h-[28px]"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 2: Meta Mensual de Ahorro */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <label htmlFor="edit-goal-amount" className="text-xs font-bold text-text">
                    Meta Mensual de Ahorro ($ COP):
                  </label>
                  <span className="font-mono text-xs font-black text-success tabular-nums">
                    {formatCOP(parseFloat(editGoalInput) || 0)}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted font-bold text-sm">$</span>
                  <input
                    id="edit-goal-amount"
                    type="number"
                    min="100000"
                    step="50000"
                    value={editGoalInput}
                    onChange={(e) => setEditGoalInput(e.target.value)}
                    required
                    placeholder="Ej. 2000000"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-surface-2 border border-border text-text text-sm font-mono font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  />
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-text-muted font-bold mr-1 uppercase">Metas sugeridas:</span>
                  {[
                    { label: '$1.5M', val: 1500000 },
                    { label: '$2.0M (Base)', val: 2000000 },
                    { label: '$2.5M', val: 2500000 },
                    { label: '$3.0M', val: 3000000 }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setEditGoalInput(String(preset.val))}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors min-h-[28px] ${
                        parseFloat(editGoalInput) === preset.val
                          ? 'bg-accent/15 border-accent text-accent'
                          : 'bg-surface-2 hover:bg-surface border-border text-text'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time Progress Preview */}
              <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-text-muted">Proyección de Progreso:</span>
                  <span className="font-mono font-black text-accent tabular-nums">
                    {Math.min(100, Math.round(((parseFloat(editSavedInput) || 0) / (parseFloat(editGoalInput) || 1)) * 100))}%
                  </span>
                </div>
                <div className="w-full h-3 bg-surface-2 rounded-full overflow-hidden border border-border">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, ((parseFloat(editSavedInput) || 0) / (parseFloat(editGoalInput) || 1)) * 100)}%`
                    }}
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditGoalsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-surface-2 hover:bg-surface text-text-muted hover:text-text text-xs font-bold transition-colors min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingGoals}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 text-xs font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[44px] shadow-xs disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSavingGoals ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
