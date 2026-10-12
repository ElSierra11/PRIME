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
  TrendingDown,
  Clock,
  ChevronRight,
  Trophy,
  Zap,
  DollarSign,
  Edit3,
  Trash2,
  Plus,
  Minus,
  Save,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Check
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

const CATEGORY_LABELS = {
  food: 'Comida',
  transport: 'Transporte',
  social: 'Salida / Social',
  study: 'Universidad / Tesis',
  essential: 'Fijo / Esencial',
  impulse: 'Antojo / Impulso',
  ahorro: 'Ahorro',
  arbitraje: 'Arbitraje',
  outlier: 'Outlier',
  extra: 'Ingreso Extra',
  general: 'General',
  gasto: 'Gasto'
};

/* ─── SVG Savings Chart ────────────────────────────────── */
function SavingsChart({ records, goalCOP, currentSaved }) {
  const W = 400, H = 140, PAD = { top: 16, right: 16, bottom: 28, left: 48 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  // Build cumulative savings points from records sorted chronologically
  const points = useMemo(() => {
    if (!records || records.length === 0) {
      if (currentSaved > 0) {
        return [
          { x: 0, y: 0, label: 'Inicio', amount: 0 },
          { x: 1, y: currentSaved, label: 'Actual', amount: currentSaved }
        ];
      }
      return [];
    }
    const chronological = [...records].reverse();
    let cumulative = 0;
    const pts = [{ x: 0, y: 0, label: 'Inicio', amount: 0 }];
    chronological.forEach((r, idx) => {
      const delta = r.type === 'expense' ? -(r.amountCOP || 0) : (r.amountCOP || 0);
      cumulative = Math.max(0, cumulative + delta);
      pts.push({
        x: idx + 1,
        y: cumulative,
        label: r.date || `Mov #${idx + 1}`,
        amount: cumulative,
        type: r.type
      });
    });
    return pts;
  }, [records, currentSaved]);

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
  onAddExpense,
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

  /* ─── Unified Action Modal State (Savings / Expenses / Goals) ─── */
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionTab, setActionTab] = useState('saving'); // 'saving' | 'expense' | 'goals'

  // Direct Saving State
  const [saveAmountInput, setSaveAmountInput] = useState('');
  const [saveTitleInput, setSaveTitleInput] = useState('');
  const [saveCategoryInput, setSaveCategoryInput] = useState('ahorro');
  const [isSubmittingSaving, setIsSubmittingSaving] = useState(false);

  // Direct Expense State
  const [expenseDirectAmount, setExpenseDirectAmount] = useState('');
  const [expenseDirectTitle, setExpenseDirectTitle] = useState('');
  const [expenseDirectCategory, setExpenseDirectCategory] = useState('food');
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  // Goal & Saved Edit State
  const [editSavedInput, setEditSavedInput] = useState('');
  const [editGoalInput, setEditGoalInput] = useState('');
  const [isSavingGoals, setIsSavingGoals] = useState(false);

  // Filter state for records
  const [recordsFilter, setRecordsFilter] = useState('all'); // 'all' | 'savings' | 'expenses'
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
      setIsActionModalOpen(false);
    } finally {
      setIsSavingGoals(false);
    }
  };

  /* ─── Direct Add Saving ─── */
  const handleDirectAddSaving = async (e) => {
    e?.preventDefault();
    const amount = parseFloat(saveAmountInput);
    if (isNaN(amount) || amount <= 0) {
      toast.warning({ title: 'Monto requerido', message: 'Ingresa un valor positivo a ahorrar.' });
      return;
    }
    const title = saveTitleInput.trim() || 'Ahorro ingresado';
    setIsSubmittingSaving(true);
    try {
      if (onAddSaving) {
        await onAddSaving({
          title,
          amountCOP: amount,
          category: saveCategoryInput,
          type: 'saving'
        });
      }
      sounds.playSuccessChime();
      if (currentSaved + amount >= goalCOP) {
        launchConfetti();
      }
      toast.success({
        title: '¡Ahorro registrado!',
        message: `+${formatCOP(amount)} sumados a tu saldo mensual.`,
        category: 'finance'
      });
      setSaveAmountInput('');
      setSaveTitleInput('');
      setIsActionModalOpen(false);
    } catch (err) {
      toast.error({ title: 'Error', message: 'No se pudo guardar el ahorro.' });
    } finally {
      setIsSubmittingSaving(false);
    }
  };

  /* ─── Direct Add Expense ─── */
  const handleDirectAddExpense = async (e) => {
    e?.preventDefault();
    const amount = parseFloat(expenseDirectAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.warning({ title: 'Monto requerido', message: 'Ingresa un valor de gasto válido.' });
      return;
    }
    const title = expenseDirectTitle.trim() || 'Gasto realizado';
    setIsSubmittingExpense(true);
    try {
      if (onAddExpense) {
        await onAddExpense({
          title,
          amountCOP: amount,
          category: expenseDirectCategory,
          type: 'expense'
        });
      } else if (onAddSaving) {
        await onAddSaving({
          title,
          amountCOP: amount,
          category: expenseDirectCategory,
          type: 'expense'
        });
      }
      sounds.playToastChime();
      const hours = (amount / (ratePerHour * COP_RATE)).toFixed(1);
      toast.info({
        title: 'Gasto registrado',
        message: `-${formatCOP(amount)} descontados de tu saldo (~${hours}h Outlier).`,
        category: 'finance'
      });
      setExpenseDirectAmount('');
      setExpenseDirectTitle('');
      setIsActionModalOpen(false);
    } catch (err) {
      toast.error({ title: 'Error', message: 'No se pudo registrar el gasto.' });
    } finally {
      setIsSubmittingExpense(false);
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

  /* ─── Save decision from Auditor ── */
  const handleChooseToSave = () => {
    if (!evaluationResult) return;
    onAddSaving({
      title: `Ahorrado: ${evaluationResult.name}`,
      amountCOP: evaluationResult.amountCOP,
      type: 'saving',
      category: 'ahorro'
    });
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

  /* ─── Spend decision from Auditor ── */
  const handleChooseToSpend = async () => {
    if (!evaluationResult) return;
    const amount = parseFloat(evaluationResult.amountCOP);
    const title = `Gasto: ${evaluationResult.name}`;
    if (onAddExpense) {
      await onAddExpense({
        title,
        amountCOP: amount,
        category: evaluationResult.category,
        type: 'expense'
      });
    } else if (onAddSaving) {
      await onAddSaving({
        title,
        amountCOP: amount,
        category: evaluationResult.category,
        type: 'expense'
      });
    }
    sounds.playToastChime();
    toast.warning({
      title: 'Gasto computado en tu saldo',
      message: `-${formatCOP(amount)} descontados de tu ahorro mensual.`,
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

  /* ─── Records filtering and totals ── */
  const filteredRecords = useMemo(() => {
    if (recordsFilter === 'savings') return records.filter(r => r.type !== 'expense');
    if (recordsFilter === 'expenses') return records.filter(r => r.type === 'expense');
    return records;
  }, [records, recordsFilter]);

  const displayRecords = filteredRecords.slice(0, 4);

  const totalSavedFromRecords = useMemo(() => {
    return records.filter(r => r.type !== 'expense').reduce((s, r) => s + (r.amountCOP || 0), 0);
  }, [records]);

  const totalSpentFromRecords = useMemo(() => {
    return records.filter(r => r.type === 'expense').reduce((s, r) => s + (r.amountCOP || 0), 0);
  }, [records]);

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

          {/* Saved amount chip and actions */}
          <div className="flex flex-col sm:items-end shrink-0 gap-2">
            <div>
              <span className="text-[11px] text-text-muted font-bold uppercase tracking-wide block sm:text-right">Ahorrado este mes</span>
              <span className="font-mono text-3xl font-black text-text tabular-nums leading-tight mt-0.5 block sm:text-right">
                <AnimatedNumber value={currentSaved} format="cop" duration={1000} className="text-text" />
              </span>
              <span className="text-[11px] text-text-muted font-mono tabular-nums block sm:text-right">
                de {formatCOP(goalCOP)} ({percent}%)
              </span>
            </div>

            {/* Quick Action buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setActionTab('saving');
                  setIsActionModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success/15 hover:bg-success/25 border border-success/40 text-xs font-black text-success transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
                title="Ingresar una cantidad de dinero para ahorrar"
              >
                <Plus className="w-3.5 h-3.5" />
                Ingresar Ahorro
              </button>

              <button
                type="button"
                onClick={() => {
                  setActionTab('expense');
                  setIsActionModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-danger/10 hover:bg-danger/20 border border-danger/30 text-xs font-black text-danger transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
                title="Registrar un gasto que hayas realizado"
              >
                <Minus className="w-3.5 h-3.5" />
                Registrar Gasto
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditSavedInput(String(currentSaved));
                  setEditGoalInput(String(goalCOP));
                  setActionTab('goals');
                  setIsActionModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface-2 hover:bg-surface border border-border text-xs font-bold text-text-muted hover:text-text transition-colors shadow-2xs"
                title="Modificar cuánto tengo ahorrado actualmente y meta mensual"
              >
                <Edit3 className="w-3.5 h-3.5 text-accent" />
                <span className="hidden sm:inline">Meta / Saldo</span>
              </button>
            </div>
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
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <button
                    onClick={handleChooseToSave}
                    className="flex-1 py-3 px-3 rounded-xl bg-success hover:opacity-90 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 min-h-[46px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success shadow-xs active:scale-[0.97]"
                  >
                    <PiggyBank className="w-4 h-4" /> Decido Ahorrarlo
                  </button>
                  <button
                    onClick={handleChooseToSpend}
                    className="flex-1 py-3 px-3 rounded-xl bg-danger/15 hover:bg-danger/25 text-danger border border-danger/30 font-bold text-xs transition-all flex items-center justify-center gap-1.5 min-h-[46px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger active:scale-[0.97]"
                    title="Gasto confirmado: descontar de mi balance"
                  >
                    <Minus className="w-4 h-4" /> Registrar como Gasto
                  </button>
                  <button
                    onClick={() => setEvaluationResult(null)}
                    className="py-3 px-3 rounded-xl bg-surface hover:bg-surface-2 text-text-muted hover:text-text border border-border text-xs font-semibold transition-colors min-h-[46px]"
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

        {/* ── Right Column: Chart + Movements ────────────── */}
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

            <SavingsChart records={records} goalCOP={goalCOP} currentSaved={currentSaved} />

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

          {/* Movimientos y Victorias */}
          <section
            aria-labelledby="movements-heading"
            className="bg-surface border border-border p-5 rounded-2xl shadow-xs space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 id="movements-heading" className="text-sm font-bold text-text flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" /> Movimientos y Victorias
              </h2>
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                {/* Filter pills */}
                <div className="inline-flex p-0.5 rounded-lg bg-surface-2 border border-border text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setRecordsFilter('all')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      recordsFilter === 'all' ? 'bg-surface text-text shadow-2xs' : 'text-text-muted hover:text-text'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecordsFilter('savings')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      recordsFilter === 'savings' ? 'bg-success/20 text-success' : 'text-text-muted hover:text-text'
                    }`}
                  >
                    Ahorros
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecordsFilter('expenses')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      recordsFilter === 'expenses' ? 'bg-danger/20 text-danger' : 'text-text-muted hover:text-text'
                    }`}
                  >
                    Gastos
                  </button>
                </div>
                {records.length > 4 && (
                  <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="text-xs font-bold text-accent hover:text-accent-hover flex items-center gap-0.5 ml-1 transition-colors"
                  >
                    Ver ({records.length}) <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {displayRecords.length === 0 ? (
              <div className="py-6 text-center text-xs text-text-muted italic">
                {recordsFilter === 'all'
                  ? 'Tus ahorros y gastos registrados aparecerán aquí.'
                  : recordsFilter === 'savings'
                  ? 'Aún no has registrado victorias de ahorro en este filtro.'
                  : 'No tienes gastos registrados en esta categoría.'}
              </div>
            ) : (
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
                className="space-y-2"
              >
                {displayRecords.map((rec, i) => {
                  const isExp = rec.type === 'expense';
                  return (
                    <motion.div
                      key={rec.id || i}
                      variants={{
                        hidden: { opacity: 0, x: -12 },
                        show: { opacity: 1, x: 0, transition: { duration: 0.22, ease: 'easeOut' } }
                      }}
                      className={`flex items-center justify-between p-3.5 rounded-xl bg-surface-2 border transition-all ${
                        isExp
                          ? 'border-border hover:border-danger/30 hover:bg-danger/5'
                          : 'border-border hover:border-success/30 hover:bg-success/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                            isExp ? 'bg-danger/15 text-danger' : 'bg-success/15 text-success'
                          }`}
                        >
                          {isExp ? <ArrowDownRight className="w-4 h-4" /> : <PiggyBank className="w-4 h-4" />}
                        </span>
                        <div className="min-w-0">
                          <span className="font-bold text-text text-xs block truncate">{rec.title}</span>
                          <span className="text-[11px] text-text-muted font-mono flex items-center gap-1.5 mt-0.5">
                            <span>{rec.date}</span>
                            <span>·</span>
                            <span className="capitalize">{CATEGORY_LABELS[rec.category] || rec.category || (isExp ? 'Gasto' : 'Ahorro')}</span>
                            {isExp && (
                              <span className="text-[10px] text-warning font-bold">
                                (~{(rec.amountCOP / (ratePerHour * COP_RATE)).toFixed(1)}h Outlier)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span
                          className={`font-mono font-black tabular-nums text-xs ${
                            isExp ? 'text-danger' : 'text-success'
                          }`}
                        >
                          {isExp ? `-${formatCOP(rec.amountCOP)}` : `+${formatCOP(rec.amountCOP)}`}
                        </span>
                        {onDeleteSaving && (
                          <button
                            type="button"
                            onClick={() => onDeleteSaving(rec.id)}
                            className="p-1.5 text-text-muted hover:text-danger rounded-lg hover:bg-danger-subtle/30 transition-colors"
                            title="Eliminar movimiento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {records.length > 4 && (
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-border hover:border-accent/40 text-xs font-bold text-text-muted hover:text-accent transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Ver todos los movimientos ({records.length}) →
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
                  Historial de Movimientos ({records.length})
                </h2>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label="Cerrar panel de movimientos"
                  className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-surface-2 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer totals summary */}
              <div className="px-5 py-3 bg-surface-2 border-b border-border shrink-0 grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-success-subtle border border-success/20">
                  <span className="text-[10px] text-text-muted font-bold uppercase block">Total Ahorrado</span>
                  <span className="font-mono font-black text-success text-sm tabular-nums">
                    +{formatShortCOP(totalSavedFromRecords)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-danger/10 border border-danger/20">
                  <span className="text-[10px] text-text-muted font-bold uppercase block">Total Gastado</span>
                  <span className="font-mono font-black text-danger text-sm tabular-nums">
                    -{formatShortCOP(totalSpentFromRecords)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-accent-subtle border border-accent/20">
                  <span className="text-[10px] text-text-muted font-bold uppercase block">Saldo Actual</span>
                  <span className="font-mono font-black text-accent text-sm tabular-nums">
                    {formatShortCOP(currentSaved)}
                  </span>
                </div>
              </div>

              {/* Drawer filter tabs */}
              <div className="px-5 py-2.5 border-b border-border flex items-center justify-between bg-surface shrink-0">
                <div className="inline-flex p-0.5 rounded-lg bg-surface-2 border border-border text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setRecordsFilter('all')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      recordsFilter === 'all' ? 'bg-surface text-text shadow-2xs' : 'text-text-muted hover:text-text'
                    }`}
                  >
                    Todos ({records.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecordsFilter('savings')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      recordsFilter === 'savings' ? 'bg-success/20 text-success' : 'text-text-muted hover:text-text'
                    }`}
                  >
                    Ahorros ({records.filter(r => r.type !== 'expense').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecordsFilter('expenses')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      recordsFilter === 'expenses' ? 'bg-danger/20 text-danger' : 'text-text-muted hover:text-text'
                    }`}
                  >
                    Gastos ({records.filter(r => r.type === 'expense').length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setActionTab('saving');
                    setIsActionModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 text-xs font-black transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nuevo Movimiento
                </button>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 pb-safe">
                {filteredRecords.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-8 italic">Sin movimientos en esta categoría.</p>
                ) : (
                  filteredRecords.map((rec, i) => {
                    const isExp = rec.type === 'expense';
                    return (
                      <div
                        key={rec.id || i}
                        className={`flex items-center justify-between p-3.5 rounded-xl bg-surface-2 border transition-colors ${
                          isExp ? 'border-border hover:border-danger/30' : 'border-border hover:border-success/30'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-black ${
                              isExp ? 'bg-danger/15 text-danger' : 'bg-success/15 text-success'
                            }`}
                          >
                            {isExp ? <ArrowDownRight className="w-4 h-4" /> : <PiggyBank className="w-4 h-4" />}
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold text-text text-xs block truncate">{rec.title}</span>
                            <span className="text-[11px] text-text-muted font-mono flex items-center gap-1.5">
                              <span>{rec.date}</span>
                              <span>·</span>
                              <span className="capitalize">{CATEGORY_LABELS[rec.category] || rec.category || (isExp ? 'Gasto' : 'Ahorro')}</span>
                              {isExp && (
                                <span className="text-[10px] text-warning font-bold">
                                  (~{(rec.amountCOP / (ratePerHour * COP_RATE)).toFixed(1)}h Outlier)
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span
                            className={`font-mono font-black tabular-nums text-xs ${
                              isExp ? 'text-danger' : 'text-success'
                            }`}
                          >
                            {isExp ? `-${formatCOP(rec.amountCOP)}` : `+${formatCOP(rec.amountCOP)}`}
                          </span>
                          {onDeleteSaving && (
                            <button
                              type="button"
                              onClick={() => onDeleteSaving(rec.id)}
                              className="p-1.5 text-text-muted hover:text-danger rounded-lg hover:bg-danger-subtle/30 transition-colors"
                              title="Eliminar movimiento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ─── Modal Unificado: Ingresar Ahorro / Registrar Gasto / Modificar Meta ─── */}
      {isActionModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="action-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsActionModalOpen(false);
          }}
        >
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-text animate-in zoom-in-95 duration-150">
            {/* Modal Header & Navigation Tabs */}
            <div className="p-4 sm:p-5 border-b border-border bg-surface-2/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                    actionTab === 'saving'
                      ? 'bg-success/15 border-success/30 text-success'
                      : actionTab === 'expense'
                      ? 'bg-danger/15 border-danger/30 text-danger'
                      : 'bg-accent/15 border-accent/30 text-accent'
                  }`}>
                    {actionTab === 'saving' && <PiggyBank className="w-5 h-5" />}
                    {actionTab === 'expense' && <TrendingDown className="w-5 h-5" />}
                    {actionTab === 'goals' && <Edit3 className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 id="action-modal-title" className="text-base font-extrabold text-text">
                      {actionTab === 'saving' && 'Ingresar Nuevo Ahorro'}
                      {actionTab === 'expense' && 'Registrar Gasto Realizado'}
                      {actionTab === 'goals' && 'Modificar Saldo Ahorrado & Meta'}
                    </h3>
                    <p className="text-xs text-text-muted">
                      {actionTab === 'saving' && 'Suma dinero a tu meta mensual y mantén tu progreso al día.'}
                      {actionTab === 'expense' && 'Resta gastos efectuados y vigila su costo en horas de Outlier.'}
                      {actionTab === 'goals' && 'Actualiza tu balance real acumulado y meta mensual.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActionModalOpen(false)}
                  aria-label="Cerrar modal"
                  className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-surface-2 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Segmented Control Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-surface-2 border border-border">
                <button
                  type="button"
                  onClick={() => setActionTab('saving')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                    actionTab === 'saving'
                      ? 'bg-success text-slate-950 shadow-xs'
                      : 'text-text-muted hover:text-text hover:bg-surface'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Ahorro
                </button>
                <button
                  type="button"
                  onClick={() => setActionTab('expense')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                    actionTab === 'expense'
                      ? 'bg-danger text-white shadow-xs'
                      : 'text-text-muted hover:text-text hover:bg-surface'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                  - Gasto
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditSavedInput(String(currentSaved));
                    setEditGoalInput(String(goalCOP));
                    setActionTab('goals');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                    actionTab === 'goals'
                      ? 'bg-accent text-slate-950 shadow-xs'
                      : 'text-text-muted hover:text-text hover:bg-surface'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Meta / Saldo
                </button>
              </div>
            </div>

            {/* TAB 1: INGRESAR AHORRO */}
            {actionTab === 'saving' && (
              <form onSubmit={handleDirectAddSaving} className="p-5 sm:p-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="saving-amount-input" className="text-xs font-bold text-text">
                      ¿Cuánto dinero vas a ingresar para ahorrar? ($ COP):
                    </label>
                    <span className="font-mono text-xs font-black text-success tabular-nums">
                      {formatCOP(parseFloat(saveAmountInput) || 0)}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted font-bold text-sm">$</span>
                    <input
                      id="saving-amount-input"
                      type="number"
                      min="1000"
                      step="1000"
                      value={saveAmountInput}
                      onChange={(e) => setSaveAmountInput(e.target.value)}
                      required
                      placeholder="Ej. 100000"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-surface-2 border border-border text-text text-sm font-mono font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success"
                    />
                  </div>

                  {/* Quick increment chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    <span className="text-[10px] text-text-muted font-bold mr-1 uppercase">Incrementar:</span>
                    {[
                      { label: '+20k', val: 20000 },
                      { label: '+50k', val: 50000 },
                      { label: '+100k', val: 100000 },
                      { label: '+200k', val: 200000 },
                      { label: '+500k', val: 500000 }
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => {
                          const currentVal = parseFloat(saveAmountInput) || 0;
                          setSaveAmountInput(String(currentVal + chip.val));
                        }}
                        className="px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface border border-border text-[11px] font-bold text-success hover:border-success/40 transition-colors min-h-[28px]"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="saving-title-input" className="text-xs font-bold text-text block mb-1.5">
                    Concepto o Motivo del ahorro:
                  </label>
                  <input
                    id="saving-title-input"
                    type="text"
                    value={saveTitleInput}
                    onChange={(e) => setSaveTitleInput(e.target.value)}
                    placeholder="Ej. Ahorro de la semana, pago arbitraje..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border text-text text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success"
                  />
                  {/* Preset concepts */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                    {[
                      'Ahorro semanal',
                      'Pago arbitraje COARC',
                      'Sesión Outlier extra',
                      'Sobrante quincena',
                      'Propina / Bono'
                    ].map((concept) => (
                      <button
                        key={concept}
                        type="button"
                        onClick={() => setSaveTitleInput(concept)}
                        className="px-2 py-0.5 rounded-md bg-surface-2 hover:bg-surface border border-border text-[10px] font-semibold text-text-muted hover:text-text transition-colors"
                      >
                        {concept}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="saving-category-select" className="text-xs font-bold text-text block mb-1.5">
                    Categoría de Origen:
                  </label>
                  <select
                    id="saving-category-select"
                    value={saveCategoryInput}
                    onChange={(e) => setSaveCategoryInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border text-text text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success"
                  >
                    <option value="ahorro">Ahorro General</option>
                    <option value="arbitraje">Arbitraje COARC</option>
                    <option value="outlier">Trabajo en Outlier</option>
                    <option value="extra">Ingreso Extra / Freelance</option>
                  </select>
                </div>

                {/* Real-time Savings Projection */}
                <div className="p-3.5 rounded-xl bg-success-subtle border border-success/30 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-text-muted">Nuevo Saldo Proyectado:</span>
                    <span className="font-mono font-black text-success tabular-nums">
                      {formatCOP(currentSaved + (parseFloat(saveAmountInput) || 0))}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-2 rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full bg-success rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, ((currentSaved + (parseFloat(saveAmountInput) || 0)) / goalCOP) * 100)}%`
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-text-muted text-right font-mono">
                    {Math.min(100, Math.round(((currentSaved + (parseFloat(saveAmountInput) || 0)) / goalCOP) * 100))}% de tu meta de {formatCOP(goalCOP)}
                  </p>
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsActionModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-surface-2 hover:bg-surface text-text-muted hover:text-text text-xs font-bold transition-colors min-h-[44px]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingSaving}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-success hover:opacity-90 text-slate-950 text-xs font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success min-h-[44px] shadow-xs disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    {isSubmittingSaving ? 'Guardando...' : 'Guardar Ahorro'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: REGISTRAR GASTO */}
            {actionTab === 'expense' && (
              <form onSubmit={handleDirectAddExpense} className="p-5 sm:p-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="expense-direct-amount" className="text-xs font-bold text-text">
                      ¿Cuánto gastaste? ($ COP):
                    </label>
                    <span className="font-mono text-xs font-black text-danger tabular-nums">
                      {formatCOP(parseFloat(expenseDirectAmount) || 0)}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted font-bold text-sm">$</span>
                    <input
                      id="expense-direct-amount"
                      type="number"
                      min="1000"
                      step="1000"
                      value={expenseDirectAmount}
                      onChange={(e) => setExpenseDirectAmount(e.target.value)}
                      required
                      placeholder="Ej. 45000"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-surface-2 border border-border text-text text-sm font-mono font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                    />
                  </div>

                  {/* Cost in Outlier hours alert */}
                  {parseFloat(expenseDirectAmount) > 0 && (
                    <p className="text-[11px] text-warning font-bold mt-1.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Te costó trabajar <span className="font-mono font-black text-warning">{(parseFloat(expenseDirectAmount) / (ratePerHour * COP_RATE)).toFixed(1)} horas</span> en Outlier
                    </p>
                  )}

                  {/* Quick preset buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    <span className="text-[10px] text-text-muted font-bold mr-1 uppercase">Montos frecuentes:</span>
                    {[
                      { label: '$15k', val: 15000 },
                      { label: '$30k', val: 30000 },
                      { label: '$50k', val: 50000 },
                      { label: '$100k', val: 100000 },
                      { label: '$200k', val: 200000 }
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => setExpenseDirectAmount(String(chip.val))}
                        className="px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface border border-border text-[11px] font-bold text-danger hover:border-danger/40 transition-colors min-h-[28px]"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="expense-direct-title" className="text-xs font-bold text-text block mb-1.5">
                    ¿En qué gastaste? (Concepto):
                  </label>
                  <input
                    id="expense-direct-title"
                    type="text"
                    value={expenseDirectTitle}
                    onChange={(e) => setExpenseDirectTitle(e.target.value)}
                    placeholder="Ej. Almuerzo en la U, transporte, salida..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border text-text text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                  />
                  {/* Preset concepts */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                    {[
                      'Almuerzo en la U',
                      'Transporte / Uber',
                      'Salida con amigos',
                      'Fotocopias / Tesis',
                      'Comida rápida'
                    ].map((concept) => (
                      <button
                        key={concept}
                        type="button"
                        onClick={() => setExpenseDirectTitle(concept)}
                        className="px-2 py-0.5 rounded-md bg-surface-2 hover:bg-surface border border-border text-[10px] font-semibold text-text-muted hover:text-text transition-colors"
                      >
                        {concept}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="expense-direct-category" className="text-xs font-bold text-text block mb-1.5">
                    Categoría de Gasto:
                  </label>
                  <select
                    id="expense-direct-category"
                    value={expenseDirectCategory}
                    onChange={(e) => setExpenseDirectCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border text-text text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                  >
                    <option value="food">Comida fuera de casa</option>
                    <option value="impulse">Antojo / Gasto Impulsivo</option>
                    <option value="transport">Transporte / Movilidad</option>
                    <option value="social">Salida Social / Amigos</option>
                    <option value="study">Universidad / Tesis / Libros</option>
                    <option value="essential">Gasto Fijo / Indispensable</option>
                  </select>
                </div>

                {/* Real-time Expense Impact */}
                <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-text-muted">Saldo Restante Tras el Gasto:</span>
                    <span className="font-mono font-black text-danger tabular-nums">
                      {formatCOP(Math.max(0, currentSaved - (parseFloat(expenseDirectAmount) || 0)))}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-2 rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (Math.max(0, currentSaved - (parseFloat(expenseDirectAmount) || 0)) / goalCOP) * 100)}%`
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-text-muted text-right font-mono">
                    {Math.min(100, Math.round((Math.max(0, currentSaved - (parseFloat(expenseDirectAmount) || 0)) / goalCOP) * 100))}% de tu meta
                  </p>
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsActionModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-surface-2 hover:bg-surface text-text-muted hover:text-text text-xs font-bold transition-colors min-h-[44px]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingExpense}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-danger hover:bg-danger/90 text-white text-xs font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger min-h-[44px] shadow-xs disabled:opacity-50"
                  >
                    <Minus className="w-4 h-4" />
                    {isSubmittingExpense ? 'Registrando...' : 'Registrar Gasto'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: MODIFICAR SALDO Y META */}
            {actionTab === 'goals' && (
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
                    onClick={() => setIsActionModalOpen(false)}
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
