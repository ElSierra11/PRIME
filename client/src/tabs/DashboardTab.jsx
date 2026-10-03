import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import {
  Sparkles,
  Dumbbell,
  Clock,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Check,
  Timer
} from 'lucide-react';
import confetti from 'canvas-confetti';
import WaterTrackerWidget from '../components/WaterTrackerWidget';
import AnimatedNumber from '../components/AnimatedNumber';
import { useToast } from '../hooks/useToast';

export default function DashboardTab({
  habitsData,
  onDrinkWater,
  onResetWater,
  onToggleChore,
  scheduleDayData,
  outlierStats,
  setActiveTab
}) {
  const { toast } = useToast();
  const primeSlot = scheduleDayData?.freeSlots?.find((s) => s.duration >= 60 && s.duration <= 120) || scheduleDayData?.freeSlots?.[0];
  const conflictsCount = scheduleDayData?.conflicts?.length || 0;
  const chores = habitsData?.chores || [];
  const completedChoresCount = chores.filter((c) => c.done).length;
  const allChoresCompleted = chores.length > 0 && completedChoresCount === chores.length;
  const previousCompletedRef = useRef(completedChoresCount);

  // Live countdown to Prime Slot
  const [countdownText, setCountdownText] = useState('');
  const [isSlotSoon, setIsSlotSoon] = useState(false);

  useEffect(() => {
    if (!primeSlot) {
      setCountdownText('');
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const diff = primeSlot.startMinutes - currentMinutes;

      if (diff > 0 && diff <= 180) {
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        setCountdownText(h > 0 ? `Comienza en ${h}h ${m}m` : `Comienza en ${m} min`);
        setIsSlotSoon(diff <= 45);
      } else if (diff <= 0 && currentMinutes < primeSlot.endMinutes) {
        setCountdownText('¡En curso ahora!');
        setIsSlotSoon(true);
      } else {
        setCountdownText(`Hoy ${primeSlot.startStr}`);
        setIsSlotSoon(false);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 30000);
    return () => clearInterval(interval);
  }, [primeSlot]);

  // Confetti when all chores are achieved
  useEffect(() => {
    if (allChoresCompleted && previousCompletedRef.current < chores.length) {
      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast.achievement({
          title: '¡Todos los quehaceres completados!',
          message: 'Día perfecto de constancia y rendimiento para tu Prime.',
          category: 'habits'
        });
      } catch (e) {}
    }
    previousCompletedRef.current = completedChoresCount;
  }, [allChoresCompleted, completedChoresCount, chores.length, toast]);

  // Stagger container animation
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* 1. Prime Hero Section */}
      <motion.section
        variants={itemVariants}
        aria-labelledby="hero-title"
        className="bg-surface/90 backdrop-blur-md border border-border rounded-2xl p-5 sm:p-7 shadow-xs transition-all relative overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-subtle text-accent text-xs font-black uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> REGLA DE ORO DE TU PRIME
            </div>
            
            <h1 id="hero-title" className="text-xl sm:text-2xl md:text-3xl font-extrabold text-text tracking-tight leading-tight">
              Alejo, no sacrifiques tu <span className="text-accent">Trabajo de Grado</span>: entrena 60 minutos con enfoque.
            </h1>
            
            <p className="mt-2 text-sm text-text-muted leading-relaxed">
              El objetivo de tu Prime no es pasar 3 horas en el gimnasio, sino encajar <strong>60 a 70 minutos de alta intensidad</strong> en tus ventanas libres, completar tus <strong>3 a 4 horas en Outlier</strong> y proteger tu descanso a las 10:00 PM.
            </p>
          </div>

          {/* Key Metrics Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto shrink-0">
            <div className="bg-surface-2 border border-border p-3.5 rounded-xl text-center">
              <span className="text-xs text-text-muted font-semibold block">Horas Outlier</span>
              <span className="font-mono text-xl sm:text-2xl font-black text-accent mt-0.5 block">
                <AnimatedNumber value={outlierStats?.totalWeeklyHours || 0} format="hours" />
              </span>
              <span className="text-[11px] text-text-muted block">Meta: 20h</span>
            </div>

            <div className="bg-surface-2 border border-border p-3.5 rounded-xl text-center">
              <span className="text-xs text-text-muted font-semibold block">Conflictos U</span>
              <span className={`font-mono text-xl sm:text-2xl font-black mt-0.5 block ${conflictsCount > 0 ? 'text-warning' : 'text-success'}`}>
                <AnimatedNumber value={conflictsCount} />
              </span>
              <span className="text-[11px] text-text-muted block">en agenda</span>
            </div>

            <div className="bg-surface-2 border border-border p-3.5 rounded-xl text-center col-span-2 sm:col-span-1">
              <span className="text-xs text-text-muted font-semibold block">Prime Score</span>
              <span className="font-mono text-xl sm:text-2xl font-black text-success mt-0.5 block">
                <AnimatedNumber value={habitsData?.primeScore || 85} format="percent" />
              </span>
              <span className="text-[11px] text-text-muted block">Consistencia</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 2. Mobile Swiper Carousel (< md) */}
      <div className="block md:hidden pb-3">
        <Swiper
          modules={[Pagination]}
          spaceBetween={16}
          slidesPerView={1.08}
          pagination={{ clickable: true }}
          className="pb-8"
        >
          {/* Slide 1: Ventana Prime */}
          <SwiperSlide>
            <div className="bg-surface border border-border p-5 rounded-2xl shadow-xs min-h-[260px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-accent-subtle text-accent flex items-center justify-center">
                      <Dumbbell className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-text">Ventana Prime</span>
                  </div>
                  {countdownText && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isSlotSoon ? 'bg-warning-subtle text-warning border-warning/30 animate-pulse' : 'bg-surface-2 text-text-muted border-border'
                    }`}>
                      {countdownText}
                    </span>
                  )}
                </div>

                <div className="font-mono text-xl font-black text-accent mt-2">
                  {primeSlot ? `${primeSlot.startStr} – ${primeSlot.endStr}` : 'Modo Express'}
                </div>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  {primeSlot
                    ? `${primeSlot.duration} min libres continuos sin materias de ingeniería.`
                    : 'Agenda apretada. Rutina recomendada de 35 min.'}
                </p>
              </div>

              <button
                onClick={() => setActiveTab('workout')}
                className="w-full mt-4 py-2.5 px-4 rounded-xl bg-accent text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                Ver Rutina Gym <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </SwiperSlide>

          {/* Slide 2: Hidratación */}
          <SwiperSlide>
            <WaterTrackerWidget
              waterData={habitsData?.water}
              onDrink={onDrinkWater}
              onReset={onResetWater}
            />
          </SwiperSlide>

          {/* Slide 3: Turno Outlier */}
          <SwiperSlide>
            <div className="bg-surface border border-border p-5 rounded-2xl shadow-xs min-h-[260px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-text flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-accent" /> Turno Outlier
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/20">
                    Meta: 3 - 4h
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-2 leading-relaxed">
                  Cumplir 3.5 horas diarias concentradas garantiza tu flujo semanal de ahorro en dólares sin sacrificar la tesis.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('outlier')}
                className="w-full py-2.5 px-4 rounded-xl bg-surface-2 hover:bg-surface border border-border text-accent font-bold text-xs flex items-center justify-center gap-2 min-h-[44px]"
              >
                Abrir Cronómetro Outlier →
              </button>
            </div>
          </SwiperSlide>
        </Swiper>
      </div>

      {/* 3. Desktop Grid Layout (>= md) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (lg:col-span-2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Ventana Prime Card (Desktop view) */}
          <motion.section
            variants={itemVariants}
            aria-labelledby="prime-slot-title"
            className="hidden md:block bg-surface/90 backdrop-blur-md border border-border p-5 sm:p-6 rounded-2xl shadow-xs transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent-subtle text-accent flex items-center justify-center shrink-0">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="prime-slot-title" className="text-base font-bold text-text leading-tight">
                    Ventana Prime de Hoy para Entrenar
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">Calculada para no interferir con clases ni trabajo de grado</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {countdownText && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono border flex items-center gap-1 ${
                    isSlotSoon
                      ? 'bg-warning-subtle text-warning border-warning/40 soft-pulse'
                      : 'bg-surface-2 text-text-muted border-border'
                  }`}>
                    <Timer className="w-3.5 h-3.5" />
                    {countdownText}
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-full bg-success-subtle text-success border border-success/30 text-xs font-bold font-mono">
                  {primeSlot ? `${primeSlot.duration} min libres` : 'Express'}
                </span>
              </div>
            </div>

            {primeSlot ? (
              <div className="p-4 rounded-xl bg-surface-2 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-xl sm:text-2xl font-black text-accent">
                    {primeSlot.startStr} – {primeSlot.endStr}
                  </div>
                  <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
                    Bloque libre continuo de {primeSlot.duration} minutos. Tiempo óptimo para una sesión de 60m con 4 series pesadas y descanso estricto.
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveTab('workout')}
                  className="py-2.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-bold text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[44px] shadow-xs"
                >
                  Ver Rutina (60m) <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-warning-subtle border border-warning/30 text-warning text-xs sm:text-sm leading-relaxed">
                Hoy tu agenda está ajustada. Te sugerimos ejecutar la rutina <strong>Express de 35 minutos</strong> para no cortar tu racha de entrenamiento.
              </div>
            )}

            <div className="mt-4 pt-3.5 border-t border-border flex items-center justify-between text-xs text-text-muted">
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-accent shrink-0" />
                {scheduleDayData?.events?.length || 0} compromisos programados para hoy
              </span>
              <button
                onClick={() => setActiveTab('schedule')}
                className="text-accent hover:underline font-bold transition-all min-h-[36px] flex items-center"
              >
                Abrir horario completo →
              </button>
            </div>
          </motion.section>

          {/* Hábitos del Día (Visible on both mobile & desktop) */}
          <motion.section
            variants={itemVariants}
            aria-labelledby="chores-title"
            className="bg-surface/90 backdrop-blur-md border border-border p-5 sm:p-6 rounded-2xl shadow-xs transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 id="chores-title" className="text-base font-bold text-text leading-tight">
                  Quehaceres & Hábitos del Día
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Completa cada uno antes de las 10:00 PM para apagar pantallas
                </p>
              </div>

              {/* Progress Tracker: 3/5 hechos */}
              <div className="flex items-center gap-3">
                <div className="w-24 sm:w-32 h-2.5 bg-surface-2 border border-border rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-success rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${chores.length ? (completedChoresCount / chores.length) * 100 : 0}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-text whitespace-nowrap">
                  {completedChoresCount} / {chores.length} hechos
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {chores.map((chore) => (
                <motion.label
                  key={chore.id}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer min-h-[48px] select-none ${
                    chore.done
                      ? 'bg-success-subtle border-success/35 text-text'
                      : 'bg-surface-2 border-border hover:border-accent/40 text-text'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      chore.done
                        ? 'bg-success border-success text-slate-950'
                        : 'border-border bg-surface'
                    }`}
                  >
                    {chore.done && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </motion.div>
                    )}
                  </div>

                  <input
                    type="checkbox"
                    checked={chore.done}
                    onChange={() => onToggleChore(chore.id)}
                    aria-label={chore.text}
                    className="sr-only"
                  />

                  <div className="flex-1 min-w-0">
                    <span className={`text-xs sm:text-sm font-medium leading-snug block ${
                      chore.done ? 'text-text-muted line-through' : 'text-text'
                    }`}>
                      {chore.text}
                    </span>
                  </div>
                </motion.label>
              ))}
            </div>
          </motion.section>
        </div>

        {/* Right Column on Desktop (Hidden on mobile as it's in Swiper) */}
        <div className="hidden md:flex flex-col gap-6">
          <motion.div variants={itemVariants}>
            <WaterTrackerWidget
              waterData={habitsData?.water}
              onDrink={onDrinkWater}
              onReset={onResetWater}
            />
          </motion.div>

          {/* Quick Outlier Shift Card */}
          <motion.section
            variants={itemVariants}
            aria-labelledby="quick-outlier-title"
            className="bg-surface/90 backdrop-blur-md border border-border p-5 rounded-2xl shadow-xs transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 id="quick-outlier-title" className="text-sm font-bold text-text flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" /> Turno Outlier de Hoy
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/20">
                Meta: 3 - 4h
              </span>
            </div>

            <p className="text-xs text-text-muted mb-4 leading-relaxed">
              Cumplir 3.5 horas de tareas remuneradas garantiza tu flujo constante de ahorro personal en dólares.
            </p>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab('outlier')}
              className="w-full py-2.5 px-4 rounded-xl bg-surface-2 hover:bg-surface border border-border text-accent font-bold text-xs flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[44px]"
            >
              Abrir Cronómetro Outlier →
            </motion.button>
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
}
