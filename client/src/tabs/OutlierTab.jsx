import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  DollarSign,
  Clock,
  TrendingUp,
  Zap,
  Trophy,
  Target,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { haptics } from '../utils/haptics';
import { useWakeLock } from '../hooks/useWakeLock';
import AnimatedNumber from '../components/AnimatedNumber';
import { useToast } from '../hooks/useToast';

/* ─── SVG Ring helpers ─────────────────────────────────── */
const RADIUS = 110;
const STROKE = 14;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SVG_SIZE = (RADIUS + STROKE) * 2;
const CENTER = SVG_SIZE / 2;

/**
 * Given a fraction [0..1], returns the {cx, cy} point on the ring.
 * Starts at the top (–90°) and goes clockwise.
 */
function ringPoint(fraction) {
  const angle = (fraction * 2 * Math.PI) - Math.PI / 2;
  return {
    cx: CENTER + RADIUS * Math.cos(angle),
    cy: CENTER + RADIUS * Math.sin(angle)
  };
}

/* ─── Confetti (canvas-confetti) ───────────────────────── */
async function launchConfetti(origin = { x: 0.5, y: 0.5 }) {
  try {
    const confetti = (await import('canvas-confetti')).default;
    confetti({
      particleCount: 90,
      spread: 70,
      origin,
      colors: ['#38bdf8', '#818cf8', '#34d399', '#facc15', '#f472b6']
    });
  } catch (_) { /* silently ignore if unavailable */ }
}

/* ─── Main Component ───────────────────────────────────── */
export default function OutlierTab({ outlierStats, onLogSession, onUpdateRate }) {
  const { toast } = useToast();
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [manualHours, setManualHours] = useState('');
  const [rateInput, setRateInput] = useState(outlierStats?.ratePerHourUSD || 15);
  const [celebrated3h, setCelebrated3h] = useState(false);
  const [celebrated4h, setCelebrated4h] = useState(false);
  const [showShiftsLog, setShowShiftsLog] = useState(false);

  const intervalRef = useRef(null);

  /* ─── Screen Wake Lock: pantalla encendida mientras corre el timer ── */
  useWakeLock(isRunning);

  /* ─── Timer logic ── */
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  /* ─── Milestone celebrations ── */
  useEffect(() => {
    const hrs = timerSeconds / 3600;

    if (hrs >= 3 && !celebrated3h) {
      setCelebrated3h(true);
      launchConfetti({ x: 0.5, y: 0.4 });
      haptics.outlierAchievement();
      toast.achievement({
        title: '¡Meta mínima alcanzada!',
        message: '3 horas de Outlier completadas. Ya cubriste el mínimo diario.',
        category: 'outlier'
      });
    }

    if (hrs >= 4 && !celebrated4h) {
      setCelebrated4h(true);
      launchConfetti({ x: 0.5, y: 0.4 });
      haptics.outlierAchievement();
      toast.achievement({
        title: '¡Meta ideal superada!',
        message: '4 horas de Outlier. Rendimiento máximo del día. Descansa y recarga.',
        category: 'outlier'
      });
    }
  }, [timerSeconds, celebrated3h, celebrated4h, toast]);

  /* ─── Format helpers ── */
  const formatTimer = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  /* ─── Live earnings from the running timer ── */
  const rate = parseFloat(outlierStats?.ratePerHourUSD || rateInput || 15);
  const COP_RATE = 4000;
  const liveHours = timerSeconds / 3600;
  const liveUSD = liveHours * rate;
  const liveCOP = liveUSD * COP_RATE;

  /* ─── Weekly data ── */
  const weeklyHours = outlierStats?.totalWeeklyHours || 0;
  const weeklyTarget = outlierStats?.weeklyTargetHours || 20;
  const weeklyProgressFraction = Math.min(1, weeklyHours / weeklyTarget);
  const weeklyUSD = outlierStats?.totalWeeklyUSD || 0;
  const weeklyCOP = outlierStats?.totalWeeklyCOP || 0;

  /* ─── Ring progress for session timer (max = 4 h = 14400 s) ── */
  const SESSION_MAX_S = 4 * 3600; // 4 h
  const sessionFraction = Math.min(1, timerSeconds / SESSION_MAX_S);
  const mark3hFraction = 3 / 4; // 3h out of 4h max
  const mark4hFraction = 1.0;

  // stroke-dashoffset drives the fill
  const dashOffset = CIRCUMFERENCE * (1 - sessionFraction);

  // marker points on the ring
  const mark3h = ringPoint(mark3hFraction);
  const mark4h = ringPoint(mark4hFraction);

  /* ─── Actions ── */
  const handleSaveTimerSession = () => {
    if (timerSeconds < 60) {
      toast.warning({
        title: 'Tiempo insuficiente',
        message: 'Cronometra al menos un minuto para registrar tu turno de Outlier.',
        category: 'outlier'
      });
      return;
    }
    const hours = parseFloat((timerSeconds / 3600).toFixed(2));
    onLogSession({ hours, notes: 'Sesión cronometrada en PRIME OS' });
    setIsRunning(false);
    setTimerSeconds(0);
    setCelebrated3h(false);
    setCelebrated4h(false);
    sounds.playSuccessChime();
    toast.success({
      title: 'Turno guardado',
      message: `${hours}h registradas. (+${(hours * rate).toFixed(1)} USD)`,
      category: 'outlier'
    });
  };

  const handleSaveManualSession = (e) => {
    e.preventDefault();
    const val = parseFloat(manualHours);
    if (!val || val <= 0) return;
    onLogSession({ hours: val, notes: 'Registro manual de horas Outlier' });
    setManualHours('');
    sounds.playSuccessChime();
    toast.success({
      title: 'Horas añadidas',
      message: `${val}h de Outlier añadidas exitosamente.`,
      category: 'outlier'
    });
  };

  const handleSaveRate = () => {
    const r = parseFloat(rateInput);
    if (r > 0) {
      onUpdateRate(r);
      toast.info({
        title: 'Tarifa actualizada',
        message: `Tu tarifa se fijó en $${r} USD/hora.`,
        category: 'outlier'
      });
    }
  };

  const handleToggle = () => setIsRunning((prev) => !prev);
  const handleReset = () => {
    setIsRunning(false);
    setTimerSeconds(0);
    setCelebrated3h(false);
    setCelebrated4h(false);
  };

  /* ─── Render ─────────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* ── Hero Banner ───────────────────────────── */}
      <section
        aria-labelledby="outlier-heading"
        className="bg-surface border border-border p-5 sm:p-7 rounded-2xl shadow-xs"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-subtle text-accent text-xs font-black uppercase tracking-wider mb-2">
              <Zap className="w-3.5 h-3.5" /> TURNO DIARIO · META: 3 – 4 HORAS
            </div>
            <h1
              id="outlier-heading"
              className="text-xl sm:text-2xl md:text-3xl font-extrabold text-text tracking-tight"
            >
              Trabajo Remoto Outlier
            </h1>
            <p className="text-xs sm:text-sm text-text-muted mt-1 max-w-xl leading-relaxed">
              Completar 3-4 horas concentradas diarias te permite avanzar en dólares sin descuidar la universidad ni el arbitraje.
            </p>
          </div>

          {/* Weekly compact chip */}
          <div className="p-4 rounded-xl bg-surface-2 border border-border shrink-0 space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-text-muted font-bold">Semana</span>
              <span className="font-mono text-sm font-black text-text tabular-nums">
                {weeklyHours} / {weeklyTarget} h
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Progreso semanal de horas Outlier"
              aria-valuenow={Math.round(weeklyProgressFraction * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="w-48 h-2.5 bg-surface rounded-full overflow-hidden border border-border"
            >
              <motion.div
                className="h-full bg-accent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${weeklyProgressFraction * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <div className="flex items-center justify-between gap-2 text-[11px] text-text-muted">
              <span className="font-mono font-bold text-success tabular-nums">
                +${weeklyUSD.toFixed(1)} USD
              </span>
              <span>·</span>
              <span className="font-mono font-bold text-accent tabular-nums">
                ≈${weeklyCOP.toLocaleString('es-CO')} COP
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Grid ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── SVG Ring Chronometer (3 cols) ── */}
        <section
          aria-labelledby="stopwatch-title"
          className="lg:col-span-3 bg-surface border border-border p-6 sm:p-8 rounded-2xl shadow-xs flex flex-col items-center gap-6"
        >
          <div className="text-center">
            <h2
              id="stopwatch-title"
              className="text-xs font-bold uppercase tracking-widest text-text-muted"
            >
              Cronómetro de Sesión en Vivo
            </h2>
          </div>

          {/* ── Ring + Time overlay ── */}
          <div className="relative flex items-center justify-center select-none">
            <svg
              width={SVG_SIZE}
              height={SVG_SIZE}
              viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
              aria-hidden="true"
              className="overflow-visible"
            >
              {/* Track ring (background) */}
              <circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth={STROKE}
                className="text-border"
              />

              {/* Progress arc */}
              <motion.circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${CENTER} ${CENTER})`}
                className={
                  sessionFraction >= 1
                    ? 'text-success'
                    : sessionFraction >= mark3hFraction
                    ? 'text-accent'
                    : 'text-accent'
                }
                style={{ transition: 'stroke-dashoffset 0.5s ease, color 0.4s' }}
              />

              {/* ── 3h Milestone Marker ── */}
              <circle
                cx={mark3h.cx}
                cy={mark3h.cy}
                r={8}
                fill={timerSeconds >= 3 * 3600 ? '#38bdf8' : 'var(--color-surface)'}
                stroke={timerSeconds >= 3 * 3600 ? '#38bdf8' : 'var(--color-border)'}
                strokeWidth={2}
                className="transition-all duration-500"
              />
              <text
                x={mark3h.cx}
                y={mark3h.cy - 16}
                textAnchor="middle"
                className="text-[10px] font-black fill-current"
                style={{
                  fontSize: '10px',
                  fontWeight: 900,
                  fill: timerSeconds >= 3 * 3600 ? '#38bdf8' : 'var(--color-text-muted)'
                }}
              >
                3h
              </text>

              {/* ── 4h Milestone Marker (top / 0°) ── */}
              {/* The 4h marker lives at the start (top), so we use a small decorative arc cap */}
              <circle
                cx={CENTER}
                cy={CENTER - RADIUS}
                r={8}
                fill={timerSeconds >= 4 * 3600 ? '#34d399' : 'var(--color-surface)'}
                stroke={timerSeconds >= 4 * 3600 ? '#34d399' : 'var(--color-border)'}
                strokeWidth={2}
                className="transition-all duration-500"
              />
              <text
                x={CENTER}
                y={CENTER - RADIUS - 16}
                textAnchor="middle"
                style={{
                  fontSize: '10px',
                  fontWeight: 900,
                  fill: timerSeconds >= 4 * 3600 ? '#34d399' : 'var(--color-text-muted)'
                }}
              >
                4h
              </text>
            </svg>

            {/* Center overlay: time + status */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span
                className="font-mono font-black tracking-tight tabular-nums text-text"
                style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1 }}
                aria-live="polite"
                aria-label={`Tiempo de sesión: ${formatTimer(timerSeconds)}`}
              >
                {formatTimer(timerSeconds)}
              </span>

              {/* Running pulse badge */}
              <AnimatePresence>
                {isRunning && (
                  <motion.span
                    key="running-badge"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-subtle text-success text-[11px] font-black uppercase tracking-wider"
                  >
                    <motion.span
                      className="w-2 h-2 rounded-full bg-success"
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                    />
                    En curso
                  </motion.span>
                )}
                {!isRunning && timerSeconds === 0 && (
                  <motion.span
                    key="idle-badge"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-2 text-[11px] text-text-muted font-bold"
                  >
                    Listo para iniciar
                  </motion.span>
                )}
                {!isRunning && timerSeconds > 0 && (
                  <motion.span
                    key="paused-badge"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning-subtle text-warning text-[11px] font-black uppercase tracking-wider"
                  >
                    <span className="w-2 h-2 rounded-full bg-warning" />
                    En pausa
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Milestone labels ── */}
          <div className="flex items-center justify-center gap-6 text-xs font-bold text-text-muted">
            <span
              className={`flex items-center gap-1.5 transition-colors ${
                timerSeconds >= 3 * 3600 ? 'text-accent' : ''
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              Meta mínima: 3h {timerSeconds >= 3 * 3600 && <Trophy className="w-3.5 h-3.5 text-accent" />}
            </span>
            <span
              className={`flex items-center gap-1.5 transition-colors ${
                timerSeconds >= 4 * 3600 ? 'text-success' : ''
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              Meta ideal: 4h {timerSeconds >= 4 * 3600 && <Trophy className="w-3.5 h-3.5 text-success" />}
            </span>
          </div>

          {/* ── Control Buttons ── */}
          <div className="flex items-center justify-center gap-3 flex-wrap w-full">
            {/* Play / Pause — animated icon swap */}
            <motion.button
              onClick={handleToggle}
              whileTap={{ scale: 0.94 }}
              aria-label={isRunning ? 'Pausar sesión Outlier' : 'Iniciar sesión Outlier'}
              className={`relative py-3 px-8 rounded-2xl font-black text-sm transition-colors flex items-center gap-2.5 min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shadow-sm ${
                isRunning
                  ? 'bg-warning hover:opacity-90 text-slate-950 focus-visible:ring-warning'
                  : 'bg-accent hover:bg-accent-hover text-slate-950'
              }`}
            >
              {/* Pulse ring behind button when running */}
              {isRunning && (
                <motion.span
                  className="absolute inset-0 rounded-2xl bg-warning"
                  animate={{ scale: [1, 1.06, 1], opacity: [0.5, 0.15, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                  style={{ zIndex: -1 }}
                />
              )}
              <AnimatePresence mode="wait">
                {isRunning ? (
                  <motion.span
                    key="pause"
                    initial={{ rotate: -30, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 30, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="flex items-center"
                  >
                    <Pause className="w-5 h-5 fill-current" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="play"
                    initial={{ rotate: 30, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -30, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="flex items-center"
                  >
                    <Play className="w-5 h-5 fill-current" />
                  </motion.span>
                )}
              </AnimatePresence>
              {isRunning ? 'Pausar' : 'Iniciar Sesión'}
            </motion.button>

            <button
              onClick={handleReset}
              aria-label="Reiniciar cronómetro"
              className="py-3 px-4 rounded-2xl bg-surface-2 hover:bg-surface text-text font-bold text-xs border border-border transition-colors flex items-center gap-1.5 min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <RotateCcw className="w-4 h-4" /> Reiniciar
            </button>

            <button
              onClick={handleSaveTimerSession}
              disabled={timerSeconds === 0}
              aria-label="Guardar turno Outlier"
              className="py-3 px-4 rounded-2xl bg-surface-2 hover:bg-surface text-accent disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs border border-border transition-colors flex items-center gap-1.5 min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <CheckCircle className="w-4 h-4" /> Guardar Turno
            </button>
          </div>

          {/* ── Manual Hours Input ── */}
          <div className="w-full pt-4 border-t border-border text-center">
            <span className="text-xs text-text-muted block mb-2 font-medium">
              ¿Trabajaste horas fuera de la aplicación?
            </span>
            <form
              onSubmit={handleSaveManualSession}
              className="flex items-center justify-center gap-2 max-w-xs mx-auto"
            >
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                placeholder="Ej. 3.5"
                value={manualHours}
                onChange={(e) => setManualHours(e.target.value)}
                aria-label="Horas de trabajo manual en Outlier"
                className="w-28 px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-text text-sm text-center font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[44px]"
              />
              <button
                type="submit"
                className="py-2.5 px-4 rounded-xl bg-surface-2 hover:bg-surface text-accent text-xs font-bold border border-border transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                + Añadir Horas
              </button>
            </form>
          </div>
        </section>

        {/* ── Right column: Live Earnings + Rate + Log ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Live Earnings Card */}
          <section
            aria-labelledby="earnings-heading"
            className="bg-surface border border-border p-5 rounded-2xl shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2
                id="earnings-heading"
                className="text-sm font-bold text-text flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4 text-success" />
                Ingresos en Tiempo Real
              </h2>
              <span className="text-[10px] font-mono text-text-muted">1 USD ≈ $4,000 COP</span>
            </div>

            {/* Session live earnings */}
            <div className="p-4 rounded-xl bg-accent-subtle border border-accent/20 space-y-1">
              <span className="text-[11px] text-text-muted font-bold uppercase tracking-wide block">
                Esta sesión
              </span>
              <div className="flex items-end gap-3 flex-wrap">
                <div>
                  <span className="text-[10px] text-text-muted block mb-0.5">USD</span>
                  <span className="font-mono text-2xl font-black text-accent tabular-nums leading-none">
                    $<AnimatedNumber
                      value={liveUSD}
                      duration={600}
                      decimals={2}
                      className="text-accent"
                    />
                  </span>
                </div>
                <div className="pb-0.5">
                  <span className="text-[10px] text-text-muted block mb-0.5">COP</span>
                  <span className="font-mono text-base font-black text-text tabular-nums leading-none">
                    <AnimatedNumber
                      value={liveCOP}
                      format="cop"
                      duration={600}
                      className="text-text"
                    />
                  </span>
                </div>
              </div>
              {isRunning && (
                <span className="text-[10px] text-accent font-bold flex items-center gap-1 mt-1">
                  <motion.span
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    ●
                  </motion.span>
                  Subiendo en vivo mientras el cronómetro corre
                </span>
              )}
            </div>

            {/* Weekly totals */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-surface-2 border border-border">
                <span className="text-[10px] text-text-muted font-bold block mb-1">Semana · USD</span>
                <span className="font-mono text-xl font-black text-text block tabular-nums">
                  $<AnimatedNumber value={weeklyUSD} decimals={1} duration={900} />
                </span>
                <span className="text-[10px] text-text-muted">Total generado</span>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-2 border border-border">
                <span className="text-[10px] text-text-muted font-bold block mb-1">Semana · COP</span>
                <span className="font-mono text-xl font-black text-accent block tabular-nums">
                  <AnimatedNumber value={weeklyCOP} format="cop" duration={900} />
                </span>
                <span className="text-[10px] text-text-muted">Pesos colombianos</span>
              </div>
            </div>

            {/* Hourly rate control */}
            <div className="p-3.5 rounded-xl bg-surface-2 border border-border flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-text block">Tarifa/Hora:</span>
                <span className="text-[10px] text-text-muted">Ajusta según tu rol en Outlier</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-surface rounded-xl border border-border px-2.5 py-1 min-h-[38px]">
                  <span className="text-xs text-text-muted font-mono mr-1">$</span>
                  <input
                    type="number"
                    value={rateInput}
                    onChange={(e) => setRateInput(e.target.value)}
                    aria-label="Tarifa por hora en USD"
                    className="w-14 bg-transparent text-text text-xs font-mono font-bold focus-visible:outline-none"
                  />
                  <span className="text-[10px] text-text-muted ml-1">USD</span>
                </div>
                <button
                  onClick={handleSaveRate}
                  className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-2 border border-border text-accent text-xs font-bold transition-colors min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Guardar
                </button>
              </div>
            </div>
          </section>

          {/* Recent Shifts Log — collapsible */}
          <section
            aria-labelledby="recent-shifts-heading"
            className="bg-surface border border-border rounded-2xl shadow-xs overflow-hidden"
          >
            <button
              onClick={() => setShowShiftsLog((v) => !v)}
              aria-expanded={showShiftsLog}
              className="w-full flex items-center justify-between p-5 hover:bg-surface-2 transition-colors min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-2xl"
            >
              <h2
                id="recent-shifts-heading"
                className="text-xs font-extrabold uppercase tracking-wider text-text-muted flex items-center gap-2"
              >
                <Clock className="w-3.5 h-3.5" /> Historial de Turnos Recientes
              </h2>
              {showShiftsLog
                ? <ChevronUp className="w-4 h-4 text-text-muted" />
                : <ChevronDown className="w-4 h-4 text-text-muted" />
              }
            </button>

            <AnimatePresence>
              {showShiftsLog && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  className="border-t border-border"
                >
                  <div className="p-4 space-y-2 max-h-56 overflow-y-auto">
                    {(outlierStats?.sessions || []).length === 0 ? (
                      <p className="text-xs text-text-muted text-center py-4">
                        No hay turnos registrados todavía.
                      </p>
                    ) : (
                      (outlierStats?.sessions || []).slice(0, 8).map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-border text-xs"
                        >
                          <div>
                            <span className="font-bold text-text block">{s.notes}</span>
                            <span className="text-[11px] text-text-muted font-mono">
                              {s.date} · {s.hours}h
                            </span>
                          </div>
                          <span className="font-mono font-black text-success tabular-nums">
                            +${s.earnedUSD} USD
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </div>
    </div>
  );
}
