import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dumbbell,
  Timer,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Play,
  Pause,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Target,
  AlertTriangle,
  Circle
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { haptics } from '../utils/haptics';
import { useWakeLock } from '../hooks/useWakeLock';
import { useToast } from '../hooks/useToast';

/* ─── Data ──────────────────────────────────────────────── */
const ROUTINES_DATA = {
  push: {
    id: 'push',
    label: 'Push',
    title: 'Día 1 · Empuje (Push)',
    subtitle: 'Pecho, Hombros Anterior/Lateral, Tríceps — 60 Minutos',
    description:
      'Hipertrofia y densidad torácica con descansos controlados de 90s.',
    restDefault: 90,
    exercises: [
      {
        name: 'Press de Banca Plano',
        detail: 'Mancuernas o Barra',
        sets: 4, reps: '6 – 8', rpe: 'RPE 8.5',
        restSecs: 90,
        notes: 'Pausa de 1 s en el pecho. Fallo técnico, no muscular.'
      },
      {
        name: 'Press Militar con Mancuernas',
        detail: 'Hombros',
        sets: 3, reps: '8 – 10', rpe: 'RPE 8',
        restSecs: 90,
        notes: 'Espalda firme, sin arquear lumbar. Codos a 45°.'
      },
      {
        name: 'Fondos en Paralelas',
        detail: 'O máquina asistida',
        sets: 3, reps: '8 – 12', rpe: 'RPE 8.5',
        restSecs: 90,
        notes: 'Ligera inclinación hacia adelante para activar pectoral.'
      },
      {
        name: 'Elevaciones Laterales',
        detail: 'Mancuerna o polea',
        sets: 4, reps: '12 – 15', rpe: 'RPE 9',
        restSecs: 60,
        notes: 'Control excéntrico de 2 s. No uses impulso.'
      },
      {
        name: 'Extensiones de Tríceps en Polea',
        detail: 'Con cuerda',
        sets: 3, reps: '10 – 12', rpe: 'RPE 9',
        restSecs: 60,
        notes: 'Apertura al final del recorrido para máxima contracción.'
      }
    ]
  },
  pull: {
    id: 'pull',
    label: 'Pull',
    title: 'Día 2 · Jalón (Pull)',
    subtitle: 'Espalda Completa, Deltoides Posterior, Bíceps — 60 Minutos',
    description:
      'Postura erguida para arbitrar y aguantar horas de estudio sin dolor de espalda.',
    restDefault: 90,
    exercises: [
      {
        name: 'Dominadas o Jalón al Pecho',
        detail: 'Peso corporal o máquina',
        sets: 4, reps: '8 – 10', rpe: 'RPE 8.5',
        restSecs: 90,
        notes: 'Retracción escapular completa. Ancho de agarre.'
      },
      {
        name: 'Remo con Barra o con Apoyo en Pecho',
        detail: 'Espalda media',
        sets: 4, reps: '8 – 10', rpe: 'RPE 8.5',
        restSecs: 90,
        notes: 'Codos pegados al cuerpo. Tirón hacia el abdomen.'
      },
      {
        name: 'Remo Unilateral con Mancuerna',
        detail: 'Kroc Row',
        sets: 3, reps: '10 – 12', rpe: 'RPE 8',
        restSecs: 75,
        notes: 'Tracción hacia la cadera. Espalda paralela al suelo.'
      },
      {
        name: 'Face Pulls en Polea Alta',
        detail: 'Con cuerda',
        sets: 4, reps: '15', rpe: 'RPE 8',
        restSecs: 60,
        notes: 'Salud del manguito rotador. Codos a la altura de los hombros.'
      },
      {
        name: 'Curl de Bíceps en Banco Inclinado',
        detail: 'Mancuernas',
        sets: 3, reps: '10 – 12', rpe: 'RPE 9',
        restSecs: 60,
        notes: 'Máximo estiramiento al bajar. Sin impulso del torso.'
      }
    ]
  },
  legs: {
    id: 'legs',
    label: 'Pierna',
    title: 'Día 3 · Pierna & Condición Árbitro',
    subtitle: 'Fuerza, Prevención de Desgarros y Sprints COARC — 60 Minutos',
    description:
      'Específico para aguantar 90 min corriendo en cancha y pasar pruebas físicas.',
    restDefault: 120,
    exercises: [
      {
        name: 'Sentadilla Trasera o Prensa Inclinada',
        detail: 'Barra o máquina',
        sets: 4, reps: '6 – 8', rpe: 'RPE 8.5',
        restSecs: 120,
        notes: 'Profundidad mínima 90°. Rodillas alineadas con pies.'
      },
      {
        name: 'Peso Muerto Rumano (RDL)',
        detail: 'Mancuernas',
        sets: 4, reps: '8 – 10', rpe: 'RPE 8.5',
        restSecs: 120,
        notes: 'Isquios: clave para evitar desgarros de árbitro. Cadera atrás.'
      },
      {
        name: 'Zancadas Dinámicas o Sentadilla Búlgara',
        detail: 'Unilateral',
        sets: 3, reps: '10 por pierna', rpe: 'RPE 8',
        restSecs: 90,
        notes: 'Equilibrio y fuerza unilateral. Tronco erguido.'
      },
      {
        name: 'Elevación de Gemelos de Pie',
        detail: 'En máquina',
        sets: 4, reps: '15', rpe: 'RPE 9',
        restSecs: 60,
        notes: 'Pausa de 2 s en el punto más alto. Rango completo.'
      },
      {
        name: 'Sprints Intermitentes',
        detail: '15s sprint / 15s descanso × 8',
        sets: 1, reps: '8 rondas', rpe: 'RPE 9',
        restSecs: 0,
        notes: 'Simula el test de resistencia COARC / FIFA. Pies descalzos posibles.'
      }
    ]
  },
  express: {
    id: 'express',
    label: 'Express',
    title: 'Rutina Express — 35 Minutos',
    subtitle: 'Días pesados de Universidad, Tesis o Cansancio',
    description:
      'No te saltes el hábito. 35 minutos intensos mantienen tu Prime activo.',
    restDefault: 60,
    exercises: [
      {
        name: 'Superserie 1: Press Plano + Jalón al Pecho',
        detail: 'Mancuernas / máquina',
        sets: 4, reps: '8 – 10', rpe: 'RPE 9',
        restSecs: 60,
        notes: 'Descansa 60 s entre pares. Sin descanso entre ejercicios del par.'
      },
      {
        name: 'Superserie 2: Goblet Squat + Peso Muerto Rumano',
        detail: 'Mancuerna pesada',
        sets: 3, reps: '10 – 12', rpe: 'RPE 8.5',
        restSecs: 60,
        notes: 'Descansa 60 s entre pares. Control total en la fase excéntrica.'
      },
      {
        name: 'Elevaciones Laterales + Plancha Core',
        detail: '45 s de plancha',
        sets: 3, reps: '15 reps / 45 s', rpe: 'RPE 9',
        restSecs: 45,
        notes: 'Sin descanso entre hombro y abdomen. Máxima concentración.'
      }
    ]
  }
};

/* ─── SVG Rest Ring constants ────────────────────────────── */
const R_RING = 72;
const R_STROKE = 10;
const R_CIRCUM = 2 * Math.PI * R_RING;
const R_SIZE = (R_RING + R_STROKE) * 2;
const R_CENTER = R_SIZE / 2;

/* ─── Helpers ───────────────────────────────────────────── */
const getRpeColor = (rpe) => {
  if (!rpe) return 'text-text-muted';
  const val = parseFloat(rpe.replace('RPE ', ''));
  if (val >= 9) return 'text-danger';
  if (val >= 8.5) return 'text-warning';
  return 'text-success';
};

/* ─── Component ─────────────────────────────────────────── */
export default function WorkoutTab({ addToast: legacyAddToast } = {}) {
  const { toast } = useToast();
  const [activeRoutineId, setActiveRoutineId] = useState('push');
  const [openExerciseIdx, setOpenExerciseIdx] = useState(0); // accordion open
  const [completedSets, setCompletedSets] = useState({}); // key: `${routineId}-${exIdx}-${setIdx}`
  const [currentExIdx, setCurrentExIdx] = useState(0); // mobile card carousel

  // Rest timer
  const [restTotal, setRestTotal] = useState(90);
  const [restRemaining, setRestRemaining] = useState(90);
  const [isRestRunning, setIsRestRunning] = useState(false);
  const [restKey, setRestKey] = useState(0); // force ring reset

  // Swipe
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);

  const routine = ROUTINES_DATA[activeRoutineId];
  const exercises = routine.exercises;

  /* ─── Derived progress ── */
  const totalSets = exercises.reduce((s, ex) => s + ex.sets, 0);
  const doneSets = exercises.reduce((sum, ex, exIdx) => {
    let count = 0;
    for (let s = 0; s < ex.sets; s++) {
      if (completedSets[`${activeRoutineId}-${exIdx}-${s}`]) count++;
    }
    return sum + count;
  }, 0);
  const sessionProgressFraction = totalSets > 0 ? doneSets / totalSets : 0;
  const sessionDone = doneSets === totalSets && totalSets > 0;

  const celebratedSessionRef = useRef({});

  /* ─── Screen Wake Lock: mantener pantalla encendida durante el descanso ── */
  useWakeLock(isRestRunning);

  /* ─── Rest timer countdown ── */
  useEffect(() => {
    let interval = null;
    if (isRestRunning && restRemaining > 0) {
      interval = setInterval(() => {
        setRestRemaining((prev) => prev - 1);
      }, 1000);
    } else if (isRestRunning && restRemaining === 0) {
      setIsRestRunning(false);
      sounds.playDuolingoAlarmSound();
      haptics.restDone();
      toast.reminder({
        title: '¡Descanso terminado!',
        message: 'A darle a la siguiente serie. Mantén el ritmo.',
        category: 'workout',
        priority: 2
      });
    }
    return () => clearInterval(interval);
  }, [isRestRunning, restRemaining, toast]);

  /* ─── Session done celebration ── */
  useEffect(() => {
    if (sessionDone && !celebratedSessionRef.current[activeRoutineId]) {
      celebratedSessionRef.current[activeRoutineId] = true;
      sounds.playSuccessChime();
      toast.achievement({
        title: '¡Sesión Prime Completa!',
        message: `Terminaste las ${totalSets} series de la rutina. Tu Prime sigue vivo.`,
        category: 'workout'
      });
    } else if (!sessionDone) {
      celebratedSessionRef.current[activeRoutineId] = false;
    }
  }, [sessionDone, totalSets, activeRoutineId, toast]);

  /* ─── Rest timer actions ── */
  const startRest = useCallback((secs) => {
    setRestTotal(secs);
    setRestRemaining(secs);
    setIsRestRunning(true);
    setRestKey((k) => k + 1);
    sounds.playToastChime();
  }, []);

  const toggleRest = () => {
    if (restRemaining === 0) {
      startRest(restTotal);
    } else {
      setIsRestRunning((prev) => !prev);
    }
  };

  const resetRest = () => {
    setIsRestRunning(false);
    setRestRemaining(restTotal);
    setRestKey((k) => k + 1);
  };

  /* ─── Set toggle ── */
  const toggleSet = (exIdx, setIdx) => {
    const key = `${activeRoutineId}-${exIdx}-${setIdx}`;
    const nowDone = !completedSets[key];
    setCompletedSets((prev) => ({ ...prev, [key]: nowDone }));

    if (nowDone) {
      sounds.playToastChime();
      haptics.seriesDone();
      const ex = exercises[exIdx];
      // auto-open next exercise accordion if this one is fully done
      const allDone = Array.from({ length: ex.sets }, (_, s) =>
        s === setIdx ? true : !!completedSets[`${activeRoutineId}-${exIdx}-${s}`]
      ).every(Boolean);
      if (allDone && exIdx < exercises.length - 1) {
        setOpenExerciseIdx(exIdx + 1);
        setCurrentExIdx(exIdx + 1);
      }
      startRest(ex.restSecs || routine.restDefault);
    }
  };

  /* ─── Routine switch ── */
  const switchRoutine = (id) => {
    setActiveRoutineId(id);
    setCompletedSets({});
    setOpenExerciseIdx(0);
    setCurrentExIdx(0);
    setIsRestRunning(false);
    setRestRemaining(ROUTINES_DATA[id].restDefault);
    setRestTotal(ROUTINES_DATA[id].restDefault);
    setRestKey((k) => k + 1);
  };

  /* ─── Mobile swipe ── */
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    const dy = e.changedTouches[0].clientY - touchStartYRef.current;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0 && currentExIdx < exercises.length - 1) {
        const next = currentExIdx + 1;
        setCurrentExIdx(next);
        setOpenExerciseIdx(next);
      } else if (dx > 0 && currentExIdx > 0) {
        const prev = currentExIdx - 1;
        setCurrentExIdx(prev);
        setOpenExerciseIdx(prev);
      }
    }
  };

  /* ─── Ring dashoffset ── */
  const restFraction = restTotal > 0 ? restRemaining / restTotal : 0;
  const restDashOffset = R_CIRCUM * (1 - restFraction);
  const restMinutes = Math.floor(restRemaining / 60);
  const restSecs = restRemaining % 60;

  /* ─── Animation variants ── */
  const listVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } }
  };

  /* ─── Render ────────────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* ── Hero Banner & Routine Picker ─────────────────── */}
      <section
        aria-labelledby="workout-heading"
        className="bg-surface border border-border p-5 sm:p-6 rounded-2xl shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-subtle text-accent text-xs font-black uppercase tracking-wider mb-2">
              <Zap className="w-3.5 h-3.5" /> FILOSOFÍA PRIME WORKOUT
            </div>
            <h1 id="workout-heading" className="text-xl sm:text-2xl font-extrabold text-text tracking-tight">
              Entrenamiento Hiper-Eficiente
            </h1>
            <p className="text-xs text-text-muted mt-0.5 leading-relaxed max-w-lg">
              Series al fallo técnico · 90 s de descanso · 60 minutos máximo. Sobrecarga progresiva sin quemarte.
            </p>
          </div>

          {/* Routine picker tabs with sliding pill */}
          <div className="relative flex items-center gap-1 p-1.5 bg-surface-2 rounded-2xl border border-border overflow-x-auto shrink-0 self-start sm:self-auto">
            {Object.values(ROUTINES_DATA).map((r) => {
              const isActive = activeRoutineId === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => switchRoutine(r.id)}
                  aria-pressed={isActive}
                  className={`relative px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap min-h-[44px] transition-colors z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isActive ? 'text-slate-950 font-black' : 'text-text-muted hover:text-text'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeRoutineTab"
                      className="absolute inset-0 bg-accent rounded-xl -z-10 shadow-xs"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Routine info */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6 pt-1 border-t border-border">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text">{routine.title}</p>
            <p className="text-xs text-accent font-semibold mt-0.5">{routine.subtitle}</p>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">{routine.description}</p>
          </div>

          {/* Session overall progress */}
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
              <Target className="w-3.5 h-3.5 text-accent" />
              Progreso de sesión
            </div>
            <div
              role="progressbar"
              aria-label="Progreso de la sesión de entrenamiento"
              aria-valuenow={Math.round(sessionProgressFraction * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="w-48 h-3 bg-surface rounded-full overflow-hidden border border-border"
            >
              <motion.div
                className={`h-full rounded-full transition-colors ${
                  sessionDone ? 'bg-success' : 'bg-accent'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${sessionProgressFraction * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs font-mono font-black text-text tabular-nums">
              {doneSets} / {totalSets} series
              {sessionDone && (
                <span className="ml-2 text-success inline-flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" /> ¡Listo!
                </span>
              )}
            </span>
          </div>
        </div>
      </section>

      {/* ── Main Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Exercises Column (accordion + mobile swipe) ── */}
        <section
          aria-labelledby="routine-exercises-heading"
          className="lg:col-span-2 bg-surface border border-border rounded-2xl shadow-xs overflow-hidden"
        >
          {/* Section header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
            <h2 id="routine-exercises-heading" className="text-sm font-bold text-text flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-accent" /> Ejercicios
            </h2>
            {/* Mobile: show exercise position indicator */}
            <div className="flex sm:hidden items-center gap-1">
              {exercises.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrentExIdx(i); setOpenExerciseIdx(i); }}
                  aria-label={`Ir al ejercicio ${i + 1}`}
                  className={`w-2 h-2 rounded-full transition-all min-h-[16px] min-w-[16px] ${
                    i === currentExIdx ? 'bg-accent scale-125' : 'bg-border hover:bg-text-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* ── MOBILE: Card Swipe View ── */}
          <div
            className="block sm:hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <AnimatePresence mode="wait">
              {exercises.map((ex, exIdx) => {
                if (exIdx !== currentExIdx) return null;
                return (
                  <motion.div
                    key={`${activeRoutineId}-mobile-${exIdx}`}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="p-4 space-y-4"
                  >
                    {/* Exercise header */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                          Ejercicio {exIdx + 1} de {exercises.length}
                        </span>
                        <span className={`text-[10px] font-black ${getRpeColor(ex.rpe)}`}>{ex.rpe}</span>
                      </div>
                      <h3 className="text-base font-black text-text leading-snug">{ex.name}</h3>
                      <p className="text-xs text-text-muted">{ex.detail} · <span className="font-mono font-bold text-accent">{ex.reps} reps</span></p>
                      <p className="text-[11px] text-text-muted italic">{ex.notes}</p>
                    </div>

                    {/* Set checklist — big touch targets */}
                    <div className="grid grid-cols-2 gap-3">
                      {Array.from({ length: ex.sets }, (_, setIdx) => {
                        const key = `${activeRoutineId}-${exIdx}-${setIdx}`;
                        const done = !!completedSets[key];
                        return (
                          <motion.button
                            key={setIdx}
                            onClick={() => toggleSet(exIdx, setIdx)}
                            whileTap={{ scale: 0.94 }}
                            aria-label={`Serie ${setIdx + 1} de ${ex.name} – ${done ? 'completada, toca para desmarcar' : 'pendiente'}`}
                            className={`relative flex flex-col items-center justify-center gap-1 py-5 px-4 rounded-2xl border-2 transition-all select-none min-h-[80px] ${
                              done
                                ? 'bg-success/10 border-success text-success shadow-[0_0_12px_rgba(52,211,153,0.2)]'
                                : 'bg-surface-2 border-border text-text-muted hover:border-accent/60 hover:text-accent active:border-accent'
                            }`}
                          >
                            <AnimatePresence mode="wait">
                              {done ? (
                                <motion.div
                                  key="checked"
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                >
                                  <CheckCircle2 className="w-7 h-7 text-success" />
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="unchecked"
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                >
                                  <Circle className="w-7 h-7" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                            <span className="text-xs font-black">Serie {setIdx + 1}</span>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Mobile nav arrows */}
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <button
                        onClick={() => { const p = Math.max(0, currentExIdx - 1); setCurrentExIdx(p); setOpenExerciseIdx(p); }}
                        disabled={currentExIdx === 0}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-surface-2 border border-border text-text-muted hover:text-text disabled:opacity-30 transition-colors text-xs font-bold min-h-[48px]"
                      >
                        <ChevronLeft className="w-4 h-4" /> Anterior
                      </button>
                      <button
                        onClick={() => { const n = Math.min(exercises.length - 1, currentExIdx + 1); setCurrentExIdx(n); setOpenExerciseIdx(n); }}
                        disabled={currentExIdx === exercises.length - 1}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-surface-2 border border-border text-text-muted hover:text-text disabled:opacity-30 transition-colors text-xs font-bold min-h-[48px]"
                      >
                        Siguiente <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* ── DESKTOP: Accordion View ── */}
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="hidden sm:block p-4 space-y-3"
          >
            {exercises.map((ex, exIdx) => {
              const isOpen = openExerciseIdx === exIdx;
              const exSetsCompleted = Array.from({ length: ex.sets }, (_, s) =>
                !!completedSets[`${activeRoutineId}-${exIdx}-${s}`]
              );
              const allExDone = exSetsCompleted.every(Boolean);
              const doneCount = exSetsCompleted.filter(Boolean).length;

              return (
                <motion.div
                  key={`${activeRoutineId}-${exIdx}`}
                  variants={itemVariants}
                  className={`rounded-2xl border overflow-hidden transition-all ${
                    allExDone
                      ? 'border-success/30 bg-success/5'
                      : isOpen
                      ? 'border-accent/40 bg-accent/5'
                      : 'border-border bg-surface-2/60'
                  }`}
                >
                  {/* Accordion header — tap to open/close */}
                  <button
                    onClick={() => setOpenExerciseIdx(isOpen ? -1 : exIdx)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-surface-2/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-2xl min-h-[56px]"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Set counter mini badge */}
                      <div
                        className={`shrink-0 w-9 h-9 rounded-xl flex flex-col items-center justify-center border text-[9px] font-black leading-tight ${
                          allExDone
                            ? 'bg-success/20 border-success/40 text-success'
                            : 'bg-surface border-border text-text-muted'
                        }`}
                      >
                        {allExDone
                          ? <CheckCircle2 className="w-5 h-5 text-success" />
                          : <><span className="text-accent text-sm font-black leading-none">{doneCount}</span><span>/{ex.sets}</span></>
                        }
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className={`text-sm font-bold block truncate ${allExDone ? 'line-through text-text-muted' : 'text-text'}`}>
                          {exIdx + 1}. {ex.name}
                        </span>
                        <span className="text-[11px] text-text-muted">
                          {ex.detail} · <span className="font-mono text-accent font-bold">{ex.sets}×{ex.reps}</span> · <span className={`font-bold ${getRpeColor(ex.rpe)}`}>{ex.rpe}</span>
                        </span>
                      </div>
                    </div>

                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
                    </motion.div>
                  </button>

                  {/* Accordion body */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        className="border-t border-border/50"
                      >
                        <div className="p-4 space-y-4">
                          {/* Notes */}
                          <p className="text-[11px] text-text-muted italic">{ex.notes}</p>

                          {/* Set checkboxes — generously sized for sweaty gym hands */}
                          <div className="flex flex-wrap gap-3">
                            {Array.from({ length: ex.sets }, (_, setIdx) => {
                              const key = `${activeRoutineId}-${exIdx}-${setIdx}`;
                              const done = !!completedSets[key];
                              return (
                                <motion.button
                                  key={setIdx}
                                  onClick={() => toggleSet(exIdx, setIdx)}
                                  whileTap={{ scale: 0.9 }}
                                  aria-label={`Marcar serie ${setIdx + 1} de ${ex.name} como ${done ? 'pendiente' : 'completada'}`}
                                  className={`relative flex flex-col items-center justify-center gap-1.5 w-16 h-16 rounded-2xl border-2 transition-all select-none cursor-pointer min-h-[64px] min-w-[64px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                                    done
                                      ? 'bg-success/15 border-success text-success shadow-[0_0_10px_rgba(52,211,153,0.25)]'
                                      : 'bg-surface border-border text-text-muted hover:border-accent/60 hover:text-accent'
                                  }`}
                                >
                                  <AnimatePresence mode="wait">
                                    {done ? (
                                      <motion.div
                                        key="done"
                                        initial={{ scale: 0, rotate: -20 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        exit={{ scale: 0 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                      >
                                        <CheckCircle2 className="w-6 h-6" />
                                      </motion.div>
                                    ) : (
                                      <motion.div
                                        key="empty"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                      >
                                        <Circle className="w-6 h-6" />
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                  <span className="text-[10px] font-black leading-none">S{setIdx + 1}</span>
                                </motion.button>
                              );
                            })}
                          </div>

                          {/* Quick rest launcher */}
                          {ex.restSecs > 0 && (
                            <div className="flex items-center gap-2 pt-1">
                              <span className="text-[11px] text-text-muted font-bold">Descanso recomendado:</span>
                              <button
                                onClick={() => startRest(ex.restSecs)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-2 border border-border text-accent text-xs font-bold transition-colors min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                              >
                                <Timer className="w-3.5 h-3.5" />
                                {ex.restSecs}s
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* ── Right Column: Rest Timer + COARC Note ── */}
        <div className="space-y-6">

          {/* ── Rest Timer Widget ── */}
          <section
            aria-labelledby="rest-timer-heading"
            className="bg-surface border border-border p-5 rounded-2xl shadow-xs flex flex-col items-center gap-4"
          >
            <div className="text-center">
              <h2
                id="rest-timer-heading"
                className="text-xs font-black uppercase tracking-wider text-text-muted flex items-center justify-center gap-1.5"
              >
                <Timer className="w-4 h-4 text-accent" /> Descanso Entre Series
              </h2>
            </div>

            {/* SVG Circular countdown ring */}
            <div className="relative flex items-center justify-center">
              <svg
                key={restKey}
                width={R_SIZE}
                height={R_SIZE}
                viewBox={`0 0 ${R_SIZE} ${R_SIZE}`}
                aria-hidden="true"
              >
                {/* Track */}
                <circle
                  cx={R_CENTER} cy={R_CENTER} r={R_RING}
                  fill="none" strokeWidth={R_STROKE}
                  stroke="currentColor" className="text-border"
                />
                {/* Countdown arc */}
                <motion.circle
                  cx={R_CENTER} cy={R_CENTER} r={R_RING}
                  fill="none" strokeWidth={R_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={R_CIRCUM}
                  strokeDashoffset={restDashOffset}
                  transform={`rotate(-90 ${R_CENTER} ${R_CENTER})`}
                  stroke="currentColor"
                  className={
                    restRemaining === 0 ? 'text-success' :
                    restFraction < 0.25 ? 'text-danger' :
                    restFraction < 0.5 ? 'text-warning' :
                    'text-accent'
                  }
                  style={{ transition: 'stroke-dashoffset 0.9s linear, color 0.3s' }}
                />
              </svg>

              {/* Center text overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span
                  className={`font-mono font-black tabular-nums select-none ${
                    restRemaining <= 10 && isRestRunning && restRemaining > 0
                      ? 'text-danger'
                      : 'text-text'
                  }`}
                  style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', lineHeight: 1 }}
                  aria-live="polite"
                  aria-label={`Descanso: ${restMinutes}:${String(restSecs).padStart(2, '0')}`}
                >
                  {restMinutes}:{String(restSecs).padStart(2, '0')}
                </span>
                {restRemaining === 0 && (
                  <span className="text-[10px] font-black text-success uppercase mt-1">¡Ya!</span>
                )}
                {isRestRunning && restRemaining > 0 && (
                  <motion.span
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="text-[10px] text-accent font-bold mt-1"
                  >
                    corriendo
                  </motion.span>
                )}
              </div>
            </div>

            {/* Quick preset buttons */}
            <div className="flex items-center gap-2">
              {[60, 90, 120].map((secs) => (
                <button
                  key={secs}
                  onClick={() => startRest(secs)}
                  aria-label={`Iniciar descanso de ${secs} segundos`}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all min-h-[44px] min-w-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    restTotal === secs && (isRestRunning || restRemaining < restTotal)
                      ? 'bg-accent text-slate-950 border-accent font-black shadow-xs'
                      : 'bg-surface-2 border-border text-text-muted hover:text-text hover:bg-surface'
                  }`}
                >
                  {secs}s
                  {secs === 90 && <span className="block text-[9px] opacity-70">Prime</span>}
                </button>
              ))}
            </div>

            {/* Play / Pause / Reset — large gym-friendly buttons */}
            <div className="flex items-center gap-3 w-full">
              <motion.button
                onClick={toggleRest}
                whileTap={{ scale: 0.94 }}
                aria-label={isRestRunning ? 'Pausar descanso' : 'Reanudar descanso'}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm transition-all min-h-[52px] focus-visible:outline-none focus-visible:ring-2 shadow-sm ${
                  isRestRunning
                    ? 'bg-warning text-slate-950 focus-visible:ring-warning'
                    : 'bg-accent hover:bg-accent-hover text-slate-950 focus-visible:ring-accent'
                }`}
              >
                <AnimatePresence mode="wait">
                  {isRestRunning ? (
                    <motion.span key="pause" initial={{ rotate: -20, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 20, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <Pause className="w-5 h-5 fill-current" />
                    </motion.span>
                  ) : (
                    <motion.span key="play" initial={{ rotate: 20, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -20, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <Play className="w-5 h-5 fill-current" />
                    </motion.span>
                  )}
                </AnimatePresence>
                {isRestRunning ? 'Pausar' : 'Iniciar'}
              </motion.button>

              <button
                onClick={resetRest}
                aria-label="Reiniciar temporizador de descanso"
                className="py-3.5 px-4 rounded-2xl bg-surface-2 hover:bg-surface text-text font-bold border border-border transition-colors flex items-center gap-1.5 min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* ── COARC Referee Physical Note ── */}
          <section
            aria-labelledby="referee-heading"
            className="bg-surface border border-border p-5 rounded-2xl text-xs space-y-3 shadow-xs"
          >
            <h2 id="referee-heading" className="font-extrabold text-warning flex items-center gap-1.5 text-sm">
              <ShieldCheck className="w-4 h-4 shrink-0" /> Árbitro COARC
            </h2>
            <div className="space-y-2 text-text-muted leading-relaxed">
              <div className="p-2.5 rounded-xl bg-warning-subtle border border-warning/20">
                <p>
                  <strong className="text-text">Jueves:</strong> Si tienes entrenamiento físico COARC a las 7:15 PM, modera la carga de piernas el miércoles para evitar sobreentrenamiento.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-2 border border-border">
                <p>
                  <strong className="text-text">Isquiotibiales:</strong> El RDL es tu seguro contra desgarros en partido. No lo omitas en la rutina de Pierna.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
