/**
 * useNotifications.js — Sistema Unificado de Notificaciones Locales, Calendario y Web Push para PRIME OS
 *
 * Soporta:
 * 1. Alarma Duolingo a las 10:00 PM (22:00) para ir a dormir
 * 2. Recordatorios de eventos del Calendario (15 min antes y al inicio)
 * 3. Recordatorios de hidratación (Agua 2.5L) durante el día
 * 4. Suscripción y recepción de Web Push VAPID para segundo plano / PWA
 * 5. Notificación de prueba inmediata con vibración háptica para móvil
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { sounds } from '../utils/audio';
import { haptics } from '../utils/haptics';

const SLEEP_SHOWN_KEY = 'prime_notif_sleep_date';
const WATER_SHOWN_KEY = 'prime_notif_water_hour';
const PERM_KEY        = 'prime_notif_permission';

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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
  scheduleEvents = [],
  addToast = () => {}
}) {
  const [permission, setPermission] = useState(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const isSupported = typeof Notification !== 'undefined';
  const intervalRef = useRef(null);

  // Registro del Service Worker y suscripción a Web Push VAPID
  const subscribeToWebPush = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const reg = await navigator.serviceWorker.ready;
      if (!reg) return;

      // Obtener llave pública del servidor
      const keyRes = await fetch('/api/notifications/push/public-key');
      const keyData = await keyRes.json();
      if (!keyData.success || !keyData.publicKey) return;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const convertedVapidKey = urlB64ToUint8Array(keyData.publicKey);
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }

      if (sub) {
        await fetch('/api/notifications/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub)
        });
        setIsPushSubscribed(true);
      }
    } catch (err) {
      console.warn('Aviso al suscribir Web Push:', err.message);
    }
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(() => {
        if (Notification.permission === 'granted') {
          subscribeToWebPush();
        }
      }).catch((err) => {
        console.warn('Error registrando Service Worker:', err);
      });
    }
  }, [subscribeToWebPush]);

  /** Evalúa y dispara las alertas programadas según la hora */
  const checkScheduledAlerts = useCallback(() => {
    if (permission !== 'granted') return;

    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const currentTotalMin = h * 60 + m;
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

    // 2. Alertas de Calendario (15 min antes y al inicio)
    if (scheduleEvents && scheduleEvents.length > 0) {
      scheduleEvents.forEach(ev => {
        if (!ev.start) return;
        const [evH, evM] = ev.start.split(':').map(Number);
        const eventStartMin = evH * 60 + evM;
        const diff = eventStartMin - currentTotalMin;

        // 15 minutos antes (ventana entre 13 y 15 min)
        if (diff >= 13 && diff <= 15) {
          const key15 = `prime_notif_15m_${ev.id}_${todayStr}`;
          if (!localStorage.getItem(key15)) {
            localStorage.setItem(key15, 'true');
            haptics.buttonPress();
            try { sounds.playToastChime(); } catch (_) {}

            triggerNotification(`⚡ En 15 min: ${ev.title}`, {
              body: `${ev.start} - ${ev.end}${ev.notes ? ' • ' + ev.notes : ''}`,
              tag: `prime-ev-15-${ev.id}`,
              data: { url: '/?tab=schedule' }
            });

            addToast({
              type: 'warning',
              title: `⚡ En 15 min: ${ev.title}`,
              message: `${ev.start} - ${ev.end}. ¡Momento de prepararte!`
            });
          }
        }

        // Al inicio (ventana entre 0 y 2 minutos)
        if (diff >= 0 && diff <= 2) {
          const keyStart = `prime_notif_start_${ev.id}_${todayStr}`;
          if (!localStorage.getItem(keyStart)) {
            localStorage.setItem(keyStart, 'true');
            haptics.seriesDone();
            try { sounds.playSuccessChime(); } catch (_) {}

            triggerNotification(`🚀 ¡Iniciando ahora! ${ev.title}`, {
              body: `${ev.start} - ${ev.end}${ev.notes ? ' • ' + ev.notes : ''}`,
              tag: `prime-ev-start-${ev.id}`,
              data: { url: '/?tab=schedule' }
            });

            addToast({
              type: 'success',
              title: `🚀 ¡Iniciando ahora!`,
              message: `${ev.title} (${ev.start} - ${ev.end})`
            });
          }
        }
      });
    }

    // 3. Recordatorio de Hidratación: entre las 10:00 y las 19:00 cada 3 horas
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
  }, [permission, isSleepConfirmed, currentWaterMl, waterTargetMl, scheduleEvents, addToast]);

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
        await subscribeToWebPush();
        addToast({
          type: 'success',
          title: 'Notificaciones y Alertas Activas',
          message: 'Recibirás avisos 15 min antes de tus clases, arbitraje COARC, Outlier y alarma de las 10 PM.'
        });
        triggerNotification('⚡ PRIME OS Conectado', {
          body: 'Notificaciones y vibraciones push activadas correctamente en tu dispositivo.',
          vibrate: [200, 100, 200]
        });
      } else {
        addToast({
          type: 'info',
          title: 'Permiso pospuesto',
          message: 'Puedes activarlo cuando quieras desde el menú superior.'
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, [isSupported, permission, subscribeToWebPush, addToast]);

  /** Botón para probar la notificación y vibración en vivo */
  const testNotification = useCallback(async () => {
    if (permission !== 'granted') {
      await requestPermission();
      return;
    }

    haptics.alarmVibration();
    try { sounds.playToastChime(); } catch (_) {}

    triggerNotification('🔔 Prueba de Notificación PRIME OS', {
      body: '¡Excelente! Tu celular vibra y recibe alertas en segundo plano para tus eventos de calendario, alarma 10 PM y agua.',
      vibrate: [300, 100, 300, 100, 500],
      tag: 'prime-test-alert'
    });

    // También disparar prueba en el backend por Web Push
    try {
      fetch('/api/notifications/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '⚡ PRIME OS Web Push en Vivo',
          body: 'Notificación de segundo plano entregada con éxito a tu dispositivo.'
        })
      });
    } catch (_) {}

    addToast({
      type: 'success',
      title: 'Notificación de prueba enviada',
      message: 'Comprueba el centro de notificaciones y la vibración de tu teléfono.'
    });
  }, [permission, requestPermission, addToast]);

  // Intervalo de chequeo cada 30 segundos
  useEffect(() => {
    if (permission !== 'granted') return;
    checkScheduledAlerts();
    intervalRef.current = setInterval(checkScheduledAlerts, 30_000);
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
    isPushSubscribed,
    requestPermission,
    testNotification
  };
}
