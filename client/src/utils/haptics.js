/**
 * haptics.js — Util de vibración háptica para PRIME OS
 *
 * Usa navigator.vibrate (Web Vibration API).
 * - Solo disponible en Android/Chrome. En iPhone/Safari navigator.vibrate no existe → no hace nada.
 * - Respeta prefers-reduced-motion: si el usuario ha desactivado animaciones, también silencia haptics.
 * - Respeta un interruptor en localStorage (clave: 'prime_haptics_enabled').
 * - Solo funciona después de una interacción del usuario (el navegador lo requiere).
 *
 * Patrones (ms):
 *   seriesDone        → pulso corto 70 ms
 *   restDone          → doble: 120 ms · pausa 80 ms · 120 ms
 *   waterGoal         → largo suave: 200 ms · 100 · 200 · 100 · 200
 *   outlierAchievement → celebración: 80·40·80·40·300·80·80·40·250
 */

const KEY = 'prime_haptics_enabled';

function supported() {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

function reducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function shouldFire() {
  if (!supported()) return false;
  if (reducedMotion()) return false;
  // Default: habilitado a menos que el usuario lo haya desactivado explícitamente
  return localStorage.getItem(KEY) !== 'false';
}

function fire(pattern) {
  if (!shouldFire()) return;
  try {
    navigator.vibrate(pattern);
  } catch (_) {
    // Silencioso: algunos browsers lanzan en contextos sin interacción
  }
}

export const haptics = {
  /** ¿Está habilitado actualmente? (para el interruptor en UI) */
  isEnabled() {
    return shouldFire();
  },

  /** ¿Es compatible con este dispositivo/navegador? */
  isSupported() {
    return supported();
  },

  /** Activa o desactiva desde el interruptor en ajustes */
  setEnabled(val) {
    localStorage.setItem(KEY, val ? 'true' : 'false');
  },

  /** Serie completada en WorkoutTab — pulso corto */
  seriesDone() {
    fire(70);
  },

  /** Fin del temporizador de descanso — doble golpe */
  restDone() {
    fire([120, 80, 120]);
  },

  /** Meta de agua cumplida — largo suave */
  waterGoal() {
    fire([200, 100, 200, 100, 200]);
  },

  /** Logro Outlier (3h o 4h) — patrón de celebración */
  outlierAchievement() {
    fire([80, 40, 80, 40, 300, 80, 80, 40, 250]);
  },
};
