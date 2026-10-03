/**
 * useWakeLock.js — Hook para Screen Wake Lock API
 *
 * Mantiene la pantalla encendida mientras hay un temporizador activo
 * (cronómetro de Outlier, descanso de Workout).
 *
 * Requisitos del navegador:
 * - Requiere HTTPS o localhost (no funcionará en HTTP en producción).
 * - No disponible en Firefox ni Safari < 16.4.
 * - Si la API no existe o falla, el hook es silencioso (no rompe nada).
 *
 * Uso:
 *   const { isLocked } = useWakeLock(isRunning);
 *
 * El ícono de "pantalla activa" debe mostrarse cuando isLocked === true.
 * El interruptor en ajustes se controla con 'prime_wakelock_enabled' en localStorage.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'prime_wakelock_enabled';

export function useWakeLock(active) {
  const [isLocked, setIsLocked] = useState(false);
  const [isSupported] = useState(
    () => typeof navigator !== 'undefined' && 'wakeLock' in navigator
  );
  const wakeLockRef = useRef(null);

  /** Lee la preferencia del usuario en localStorage */
  const userEnabled = useCallback(
    () => localStorage.getItem(STORAGE_KEY) !== 'false',
    []
  );

  /** Adquiere el wake lock si todavía no lo tiene */
  const acquire = useCallback(async () => {
    if (!isSupported) return;
    if (!userEnabled()) return;
    if (wakeLockRef.current) return; // ya está activo
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      setIsLocked(true);

      // El browser libera automáticamente el lock al cambiar de pestaña;
      // escuchamos el evento para reflejar el estado real.
      wakeLockRef.current.addEventListener('release', () => {
        wakeLockRef.current = null;
        setIsLocked(false);
      });
    } catch (_) {
      // Silencioso: puede fallar si el documento no está visible,
      // si el usuario denegó permiso, o si la API no está disponible.
    }
  }, [isSupported, userEnabled]);

  /** Libera el wake lock */
  const release = useCallback(async () => {
    if (!wakeLockRef.current) return;
    try {
      await wakeLockRef.current.release();
    } catch (_) {
      // Silencioso
    }
    wakeLockRef.current = null;
    setIsLocked(false);
  }, []);

  /** Ciclo principal: adquirir cuando `active` es true, liberar cuando es false */
  useEffect(() => {
    if (active) {
      acquire();
    } else {
      release();
    }
    // Limpieza al desmontar
    return () => { release(); };
  }, [active, acquire, release]);

  /** Reintento automático cuando la pestaña vuelve a estar visible */
  useEffect(() => {
    if (!isSupported) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && active) {
        acquire();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isSupported, active, acquire]);

  return { isLocked, isSupported };
}

/** Leer / escribir preferencia del interruptor desde la UI de ajustes */
export const wakeLockPrefs = {
  isEnabled: () => localStorage.getItem(STORAGE_KEY) !== 'false',
  setEnabled: (val) => localStorage.setItem(STORAGE_KEY, val ? 'true' : 'false')
};
