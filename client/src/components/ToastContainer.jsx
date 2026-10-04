/**
 * ToastContainer.jsx — Rediseño del contenedor de toasts para PRIME OS
 *
 * Características:
 * - Tipos: Éxito (verde), Error (rojo), Advertencia (ámbar), Info (azul),
 *   Logro (degradado + confeti ligero), Recordatorio (acento PRIME con ícono de categoría),
 *   Crítico (borde pulsante, persistente hasta actuar).
 * - Íconos interactivos por categoría (gota, luna, mancuerna, calendario, reloj, hábitos, alcancía).
 * - Barra de tiempo animada (pausa con hover, touch y foco).
 * - Acciones integradas: Hecho, Posponer 10 min (máx 3), Abrir, Deshacer.
 * - Descarte con swipe lateral (Framer Motion drag="x") y teclado (Esc).
 * - Pila con orden de prioridad, máx 3 visibles y contador "+N más pendientes".
 * - Agrupación de duplicados con badge "×{count}".
 * - Soporte de accesibilidad completa (aria-live polite/assertive, role alert/status, targets ≥ 44px).
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Trophy,
  X,
  Droplets,
  Moon,
  Dumbbell,
  Calendar,
  Clock,
  CheckSquare,
  PiggyBank,
  RotateCcw,
  ExternalLink,
  BellRing,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '../hooks/useToast';

/* ─── Ícono según Categoría de Recordatorio ────────────────── */
function CategoryIcon({ category, type }) {
  if (type === 'critical') {
    return <BellRing className="w-5 h-5 text-danger animate-pulse shrink-0" />;
  }

  switch (category) {
    case 'water':
      return <Droplets className="w-5 h-5 text-accent animate-bounce shrink-0" />;
    case 'sleep':
      return <Moon className="w-5 h-5 text-indigo-400 shrink-0" />;
    case 'workout':
    case 'gym':
      return <Dumbbell className="w-5 h-5 text-amber-500 shrink-0" />;
    case 'schedule':
      return <Calendar className="w-5 h-5 text-accent shrink-0" />;
    case 'outlier':
      return <Clock className="w-5 h-5 text-emerald-500 shrink-0" />;
    case 'finance':
      return <PiggyBank className="w-5 h-5 text-emerald-400 shrink-0" />;
    case 'habits':
      return <CheckSquare className="w-5 h-5 text-accent shrink-0" />;
    default:
      return <Sparkles className="w-5 h-5 text-accent shrink-0" />;
  }
}

/* ─── Ícono Principal del Toast ────────────────────────────── */
function ToastIcon({ type, category }) {
  if (type === 'reminder') {
    return <CategoryIcon category={category} type={type} />;
  }
  if (type === 'critical') {
    return <BellRing className="w-5 h-5 text-danger animate-pulse shrink-0" />;
  }
  if (type === 'logro' || type === 'achievement') {
    return <Trophy className="w-5 h-5 text-amber-400 shrink-0" />;
  }
  if (type === 'success') {
    return <CheckCircle2 className="w-5 h-5 text-success shrink-0" />;
  }
  if (type === 'error') {
    return <AlertCircle className="w-5 h-5 text-danger shrink-0" />;
  }
  if (type === 'warning') {
    return <AlertTriangle className="w-5 h-5 text-warning shrink-0" />;
  }
  return <Info className="w-5 h-5 text-accent shrink-0" />;
}

/* ─── Ítem Individual de Toast ─────────────────────────────── */
function ToastItem({ toast, removeToast, confirmReminder, snoozeReminder, snoozeCounts, onNavigateTab }) {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const duration = toast.duration || 5000;
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(duration);
  const animFrameRef = useRef(null);
  const firstActionBtnRef = useRef(null);

  const isCritical = toast.type === 'critical';
  const isPersistent = toast.persistent || isCritical;
  const isLogro = toast.type === 'logro' || toast.type === 'achievement';
  const currentSnoozeCount = snoozeCounts?.[toast.id] || 0;
  const canSnooze = currentSnoozeCount < 3;

  // Reduced motion detection
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Confeti ligero en Logro
  useEffect(() => {
    if (isLogro && !prefersReducedMotion) {
      try {
        const fn = typeof confetti === 'function' ? confetti : confetti?.default;
        if (typeof fn === 'function') {
          fn({
            particleCount: 30,
            spread: 55,
            origin: { y: 0.8, x: 0.8 },
            colors: ['#38bdf8', '#34d399', '#f59e0b']
          });
        }
      } catch (_) {}
    }
  }, [isLogro, prefersReducedMotion]);

  // Si es crítico, poner foco accesible en el primer botón
  useEffect(() => {
    if (isCritical && firstActionBtnRef.current) {
      firstActionBtnRef.current.focus();
    }
  }, [isCritical]);

  // Barra de tiempo que se vacía
  useEffect(() => {
    if (isPersistent) return;

    if (isPaused) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const step = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const left = Math.max(0, remainingTimeRef.current - elapsed);
      const pct = (left / duration) * 100;
      setProgress(pct);

      if (left <= 0) {
        removeToast(toast.id);
      } else {
        animFrameRef.current = requestAnimationFrame(step);
      }
    };

    startTimeRef.current = Date.now();
    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPaused, duration, toast.id, removeToast, isPersistent]);

  const pauseTimer = () => {
    if (isPersistent) return;
    setIsPaused(true);
    remainingTimeRef.current = (progress / 100) * duration;
  };

  const resumeTimer = () => {
    if (isPersistent) return;
    setIsPaused(false);
    startTimeRef.current = Date.now();
  };

  // Clases y colores de borde según el tipo
  const borderAndBgStyles = useMemo(() => {
    if (isCritical) {
      return 'border-danger ring-2 ring-danger/40 ring-offset-1 ring-offset-bg bg-surface/95 shadow-danger/20';
    }
    if (isLogro) {
      return 'border-accent bg-gradient-to-r from-surface/95 via-surface/90 to-accent-subtle/40';
    }
    if (toast.type === 'success') {
      return 'border-success/50 bg-surface/95 shadow-success/10';
    }
    if (toast.type === 'error') {
      return 'border-danger/50 bg-surface/95 shadow-danger/10';
    }
    if (toast.type === 'warning') {
      return 'border-warning/50 bg-surface/95 shadow-warning/10';
    }
    if (toast.type === 'reminder') {
      return 'border-accent/60 bg-surface/95 shadow-accent/10';
    }
    return 'border-border bg-surface/95';
  }, [isCritical, isLogro, toast.type]);

  const progressBarColor = useMemo(() => {
    if (isLogro) return 'bg-accent';
    if (toast.type === 'success') return 'bg-success';
    if (toast.type === 'error') return 'bg-danger';
    if (toast.type === 'warning') return 'bg-warning';
    return 'bg-accent';
  }, [isLogro, toast.type]);

  return (
    <motion.div
      layout={!prefersReducedMotion}
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, x: 60, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 80) {
          removeToast(toast.id);
        }
      }}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      onTouchStart={pauseTimer}
      onTouchEnd={resumeTimer}
      onFocus={pauseTimer}
      onBlur={resumeTimer}
      tabIndex={0}
      role={isCritical || toast.type === 'error' ? 'alert' : 'status'}
      aria-live={isCritical || toast.type === 'error' ? 'assertive' : 'polite'}
      className={`relative overflow-hidden pointer-events-auto flex flex-col gap-2 p-3.5 sm:p-4 rounded-2xl shadow-xl border backdrop-blur-md text-text transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${borderAndBgStyles}`}
    >
      {/* Encabezado: Ícono + Título + Badge de duplicados + Botón Cerrar */}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <ToastIcon type={toast.type} category={toast.category} />
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-xs sm:text-sm font-black tracking-tight text-text leading-tight">
              {toast.title}
            </h4>

            {/* Agrupación de duplicados */}
            {toast.count > 1 && (
              <span className="px-1.5 py-0.5 rounded-full bg-accent/20 border border-accent/40 text-[10px] font-mono font-black text-accent shrink-0">
                ×{toast.count}
              </span>
            )}

            {isCritical && (
              <span className="px-1.5 py-0.5 rounded-full bg-danger/20 border border-danger/40 text-[9px] font-black text-danger uppercase tracking-wider animate-pulse shrink-0">
                Urgente
              </span>
            )}
          </div>

          {toast.message && (
            <p className="text-xs text-text-muted mt-1 leading-relaxed line-clamp-2">
              {toast.message}
            </p>
          )}
        </div>

        {/* Botón de cerrar accesible (mínimo 44px táctil con padding) */}
        {!isCritical && (
          <button
            onClick={() => removeToast(toast.id)}
            aria-label="Cerrar notificación"
            className="text-text-muted hover:text-text p-1.5 rounded-xl hover:bg-surface-2 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -mr-1.5 -mt-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Botones de Acción Interactiva */}
      {((toast.actions && toast.actions.length > 0) || toast.tab) && (
        <div className="flex items-center gap-2 pt-2 border-t border-border/60 flex-wrap">
          {/* Acciones específicas del toast (Hecho, Posponer, Deshacer, etc.) */}
          {toast.actions?.map((action, idx) => {
            const isSnooze = action.label.toLowerCase().includes('posponer');
            const isDone = action.label.toLowerCase().includes('hecho');
            const isUndo = action.label.toLowerCase().includes('deshacer');

            let btnClasses = 'px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ';

            if (isDone || action.variant === 'primary') {
              btnClasses += 'bg-accent text-slate-950 font-black hover:bg-accent-hover shadow-xs';
            } else if (isUndo) {
              btnClasses += 'bg-warning text-slate-950 font-black hover:bg-warning/90 shadow-xs flex items-center gap-1.5';
            } else if (action.variant === 'danger') {
              btnClasses += 'bg-danger text-white font-black hover:bg-danger/90';
            } else {
              btnClasses += 'bg-surface-2 hover:bg-surface border border-border text-text text-xs';
            }

            return (
              <button
                key={idx}
                ref={idx === 0 ? firstActionBtnRef : undefined}
                disabled={isSnooze && !canSnooze}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                  if (!isPersistent && !isSnooze) {
                    removeToast(toast.id);
                  }
                }}
                className={`${btnClasses} ${isSnooze && !canSnooze ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isUndo && <RotateCcw className="w-3.5 h-3.5" />}
                {isSnooze && !canSnooze ? 'Pospuesto máx. (3/3)' : action.label}
              </button>
            );
          })}

          {/* Botón rápido "Abrir pestaña" si el toast tiene tab destino y no está ya en actions */}
          {toast.tab && !toast.actions?.some(a => a.label.toLowerCase().includes('abrir')) && (
            <button
              onClick={() => {
                if (onNavigateTab) onNavigateTab(toast.tab);
                removeToast(toast.id);
              }}
              className="px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface border border-border text-text text-xs font-bold transition-colors min-h-[44px] flex items-center gap-1.5 ml-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ExternalLink className="w-3.5 h-3.5 text-accent" />
              Abrir
            </button>
          )}
        </div>
      )}

      {/* Barra de progreso de tiempo (solo si no es persistente) */}
      {!isPersistent && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ${progressBarColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
}

/* ─── Contenedor Principal de Toasts ───────────────────────── */
export default function ToastContainer() {
  const {
    toasts,
    removeToast,
    confirmReminder,
    snoozeReminder,
    snoozeCounts,
    settings,
    setIsNotificationCenterOpen,
    onNavigateTab
  } = useToast();

  // Teclado: Escape cierra el toast superior más reciente
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && toasts?.length > 0) {
        const topToast = toasts[0];
        if (topToast && topToast.type !== 'critical') {
          removeToast(topToast.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toasts, removeToast]);

  // Posicionamiento responsivo y respetando ajustes (debe ejecutarse SIEMPRE antes de cualquier return condicional)
  const positionClass = useMemo(() => {
    // En móvil siempre abajo centrado por encima de la barra inferior (bottom-20)
    // En escritorio respeta settings.position
    const desktopPos =
      settings?.position === 'bottom-right'
        ? 'md:bottom-6 md:top-auto md:right-6 md:left-auto'
        : settings?.position === 'bottom-center'
        ? 'md:bottom-6 md:top-auto md:left-1/2 md:-translate-x-1/2 md:right-auto'
        : 'md:top-5 md:bottom-auto md:right-6 md:left-auto'; // 'top-right' default

    return `fixed bottom-20 left-4 right-4 max-w-sm mx-auto md:mx-0 md:max-w-md w-full z-50 flex flex-col gap-2.5 pointer-events-none pb-[env(safe-area-inset-bottom,0px)] ${desktopPos}`;
  }, [settings?.position]);

  if (!toasts || toasts.length === 0) return null;

  // Máximo 3 visibles en pantalla a la vez
  const visibleToasts = toasts.slice(0, 3);
  const hiddenCount = toasts.length - visibleToasts.length;

  return (
    <aside aria-label="Notificaciones activas de PRIME OS" className={positionClass}>
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            removeToast={removeToast}
            confirmReminder={confirmReminder}
            snoozeReminder={snoozeReminder}
            snoozeCounts={snoozeCounts}
            onNavigateTab={onNavigateTab}
          />
        ))}
      </AnimatePresence>

      {/* Indicador de más notificaciones en cola */}
      {hiddenCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="self-center pointer-events-auto"
        >
          <button
            onClick={() => setIsNotificationCenterOpen(true)}
            className="px-3.5 py-1.5 rounded-full bg-surface/90 border border-border backdrop-blur-md shadow-md text-xs font-bold text-accent hover:text-accent-hover transition-colors flex items-center gap-1.5 min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <BellRing className="w-3.5 h-3.5 text-accent animate-pulse" />
            +{hiddenCount} más en Centro de Notificaciones
          </button>
        </motion.div>
      )}
    </aside>
  );
}
