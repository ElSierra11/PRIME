/**
 * useNotifications.js — Sistema de Notificaciones Locales y Vibración para PRIME OS
 *
 * Soporta:
 * 1. Alarma Duolingo a las 10:00 PM (22:00) para ir a dormir
 * 2. Recordatorios de hidratación (Agua 2.5L) durante el día
 * 3. Notificación de prueba inmediata con vibración háptica para validar en móvil
 * 4. Integración con Service Worker para funcionamiento en segundo plano / PWA
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { sounds } from '../utils/audio';
import { haptics } from '../utils/haptics';

const SLEEP_SHOWN_KEY = 'prime_notif_sleep_date';
const WATER_SHOWN_KEY = 'prime_notif_water_hour';
const PERM_KEY        = 'prime_notif_permission';

/**
 * Muestra notificación usando Service Worker (para soporte PWA en móvil) o Notification API
 */
async function triggerNotification(title, options = {}) {
  const mergedOptions = {
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [300, 150, 300, 150, 450],
    ...options
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, mergedOptions);
        return;
      }
    }
    // Fallback estándar
    if (typeof Notification !== 'undefined') {
      new Notification(title, mergedOptions);
    }
  } catch (err) {
    console.warn('Error al disparar notificación:', err);
  }
}

export function useNotifications({
  isSleepConfirmed = false,
  currentWaterMl = 0,
  waterTargetMl = 2500,
  addToast = () => {}
}) {
  const [permission, setPermission] = useState(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const isSupported = typeof Notification !== 'undefined';
  const intervalRef = useRef(null);

  // Registro del Service Worker para PWA y notificaciones
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Error registrando Service Worker:', err);
      });
    }
  }, []);

  /** Evalúa y dispara las alertas programadas según la hora */
  const checkScheduledAlerts = useCallback(() => {
    if (permission !== 'granted') return;

    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const todayStr = now.toDateString();

    // 1. Alarma de Sueño: 10:00 PM (22:00 a 22:15)
    if (h === 22 && m <= 15) {
      const lastSleepShown = localStorage.getItem(SLEEP_SHOWN_KEY);
      if (lastSleepShown !== todayStr && !isSleepConfirmed) {
        localStorage.setItem(SLEEP_SHOWN_KEY, todayStr);
        haptics.alarmVibration();
        try { sounds.playAlarmBeep(); } catch (_) {}

        triggerNotification('🦉 MODO TÓXICO: ¡A DORMIR, ALEJO!', {
          body: 'Son las 10:00 PM. No dejes que la pantalla te robe tu rendimiento de mañana. Apaga pantallas y descansa.',
          vibrate: [400, 150, 400, 150, 800],
          tag: 'prime-duolingo-alarm',
          requireInteraction: true,
          data: { url: '/?tab=dashboard' }
        });

        addToast({
          type: 'warning',
          title: '🌙 Alarma de las 10:00 PM',
          message: 'Hora de apagar pantallas y asegurar tus 7.5h de sueño.'
        });
      }
    }

    // 2. Recordatorio de Hidratación: entre las 10:00 y las 19:00 cada 2-3 horas
    // Si aún no ha llegado a la meta de agua
    if (h >= 10 && h <= 19 && (h % 3 === 0) && m <= 5) {
      const lastWaterShown = localStorage.getItem(WATER_SHOWN_KEY);
      const currentHourTag = `${todayStr}-${h}`;

      if (lastWaterShown !== currentHourTag && currentWaterMl < waterTargetMl) {
        localStorage.setItem(WATER_SHOWN_KEY, currentHourTag);
        haptics.buttonPress();
        try { sounds.playWaterDrop(); } catch (_) {}

        triggerNotification('💧 Hidratación Prime (Meta 2.5L)', {
          body: `Llevas ${currentWaterMl} ml de ${waterTargetMl} ml. ¡Tómate un vaso de agua ahora para mantener tu energía alta!`,
          vibrate: [200, 100, 200],
          tag: 'prime-water-reminder',
          data: { url: '/?tab=dashboard' }
        });
      }
    }
  }, [permission, isSleepConfirmed, currentWaterMl, waterTargetMl, addToast]);

  /** Pide permiso explícito al usuario */
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      addToast({
        type: 'warning',
        title: 'No compatible',
        message: 'Tu navegador actual no admite notificaciones locales. En iPhone, añade PRIME a tu pantalla de inicio primero.'
      });
      return;
    }

    if (permission === 'denied') {
      addToast({
        type: 'warning',
        title: 'Notificaciones bloqueadas',
        message: 'Para activarlas: ve a Configuración del navegador → Permisos del sitio → Notificaciones → Permitir.'
      });
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      localStorage.setItem(PERM_KEY, result);

      if (result === 'granted') {
        haptics.seriesDone();
        addToast({
          type: 'success',
          title: 'Notificaciones y Alertas Activas',
          message: 'Recibirás la alarma Duolingo a las 10:00 PM y recordatorios de agua en tu celular.'
        });
        // Disparar una prueba suave de bienvenida
        triggerNotification('⚡ PRIME OS Conectado', {
          body: 'Notificaciones y vibraciones activadas correctamente en tu dispositivo.',
          vibrate: [200, 100, 200]
        });
      } else {
        addToast({
          type: 'info',
          title: 'Permiso pospuesto',
          message: 'Puedes activarlo cuando quieras desde el menú de perfil.'
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, [isSupported, permission, addToast]);

  /** Botón para probar la notificación y vibración en vivo */
  const testNotification = useCallback(() => {
    if (permission !== 'granted') {
      requestPermission();
      return;
    }

    haptics.alarmVibration();
    try { sounds.playToastChime(); } catch (_) {}

    triggerNotification('🔔 Prueba de Notificación PRIME OS', {
      body: '¡Excelente! Tu celular vibra y recibe alertas en segundo plano para la alarma de las 10 PM y tu agua.',
      vibrate: [300, 100, 300, 100, 500],
      tag: 'prime-test-alert'
    });

    addToast({
      type: 'success',
      title: 'Notificación de prueba enviada',
      message: 'Comprueba el centro de notificaciones y la vibración de tu teléfono.'
    });
  }, [permission, requestPermission, addToast]);

  // Intervalo de chequeo cada 45 segundos
  useEffect(() => {
    if (permission !== 'granted') return;
    checkScheduledAlerts();
    intervalRef.current = setInterval(checkScheduledAlerts, 45_000);
    return () => clearInterval(intervalRef.current);
  }, [permission, checkScheduledAlerts]);

  // Chequeo al reactivar la pestaña
  useEffect(() => {
    const handleVisChange = () => {
      if (document.visibilityState === 'visible') {
        checkScheduledAlerts();
      }
    };
    document.addEventListener('visibilitychange', handleVisChange);
    return () => document.removeEventListener('visibilitychange', handleVisChange);
  }, [checkScheduledAlerts]);

  return {
    permission,
    isSupported,
    requestPermission,
    testNotification
  };
}
