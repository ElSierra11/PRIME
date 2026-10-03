/**
 * ToastContext.jsx — Sistema Unificado de Toasts y Centro de Notificaciones de PRIME OS
 *
 * Implementa:
 * - Contexto + Reducer sin librerías externas.
 * - API única: toast.success, error, warning, info, achievement, reminder, critical, undo.
 * - Agrupación de duplicados ("Hidratación ×3"), ordenamiento por prioridad.
 * - Soporte para recordatorios interactivos (Hecho, Posponer hasta 3 veces, Abrir).
 * - Toasts críticos con sonido una sola vez, sin temporizador y título parpadeante "(1) PRIME".
 * - Toasts destructivos con botón Deshacer (5-6 s).
 * - Historial persistente sincronizado con notificationsApi.
 * - Ajustes del usuario (Sonido, Vibración, Duración, Posición, No Molestar).
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { sounds } from '../utils/audio';
import { haptics } from '../utils/haptics';
import { notificationsApi } from '../services/notificationsApi';

const ToastContext = createContext(null);

const SETTINGS_STORAGE_KEY = 'prime_toast_settings';

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  vibrationEnabled: true,
  duration: 5000,
  position: 'top-right', // 'top-right' | 'bottom-right' | 'bottom-center'
  doNotDisturb: false
};

const PRIORITY_MAP = {
  critical: 100,
  reminder: 75,
  achievement: 50,
  logro: 50,
  error: 45,
  warning: 40,
  info: 25,
  success: 20
};

function loadStoredSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch (_) {
    return DEFAULT_SETTINGS;
  }
}

const initialState = {
  toasts: [],
  history: notificationsApi.getHistory(),
  settings: loadStoredSettings(),
  isNotificationCenterOpen: false,
  snoozeCounts: {} // { [id]: number }
};

function toastReducer(state, action) {
  switch (action.type) {
    case 'ADD_TOAST': {
      const incoming = action.payload;

      // Si No Molestar está activo y NO es crítico, no mostrar toast emergente, solo archivar en historial
      if (state.settings.doNotDisturb && incoming.type !== 'critical') {
        const historyItem = {
          id: incoming.id || `toast-${Date.now()}`,
          title: incoming.title,
          message: incoming.message,
          type: incoming.type,
          category: incoming.category,
          tab: incoming.tab,
          timestamp: Date.now(),
          read: false,
          status: 'delivered'
        };
        const updatedHistory = notificationsApi.saveHistoryItem(historyItem);
        return { ...state, history: updatedHistory };
      }

      // Comprobar si ya existe un toast idéntico (por id o por título + tipo + mensaje)
      const existingIdx = state.toasts.findIndex(
        (t) => (incoming.id && t.id === incoming.id) ||
               (t.title === incoming.title && t.type === incoming.type && t.message === incoming.message)
      );

      let nextToasts;
      if (existingIdx >= 0) {
        // Incrementar contador y refrescar
        nextToasts = [...state.toasts];
        const existing = nextToasts[existingIdx];
        nextToasts[existingIdx] = {
          ...existing,
          ...incoming,
          count: (existing.count || 1) + 1,
          createdAt: Date.now(),
          paused: false
        };
      } else {
        const newToast = {
          id: incoming.id || `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          count: 1,
          createdAt: Date.now(),
          priority: PRIORITY_MAP[incoming.type] || 20,
          ...incoming
        };
        nextToasts = [newToast, ...state.toasts];
      }

      // Ordenar por prioridad descendente (crítico primero, luego recordatorio, logro, etc.)
      nextToasts.sort((a, b) => (b.priority || 0) - (a.priority || 0));

      // Guardar también en historial (para el Centro de Notificaciones)
      const historyItem = {
        id: incoming.id || `hist-${Date.now()}`,
        title: incoming.title,
        message: incoming.message,
        type: incoming.type,
        category: incoming.category,
        tab: incoming.tab,
        timestamp: Date.now(),
        read: false,
        status: incoming.type === 'critical' ? 'critical' : 'delivered'
      };
      const updatedHistory = notificationsApi.saveHistoryItem(historyItem);

      return {
        ...state,
        toasts: nextToasts,
        history: updatedHistory
      };
    }

    case 'REMOVE_TOAST': {
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.payload)
      };
    }

    case 'DISMISS_ALL': {
      return {
        ...state,
        toasts: []
      };
    }

    case 'UPDATE_SETTINGS': {
      const merged = { ...state.settings, ...action.payload };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
      } catch (_) {}
      return {
        ...state,
        settings: merged
      };
    }

    case 'INCREMENT_SNOOZE': {
      const { id } = action.payload;
      const current = state.snoozeCounts[id] || 0;
      return {
        ...state,
        snoozeCounts: { ...state.snoozeCounts, [id]: current + 1 }
      };
    }

    case 'SET_NOTIFICATION_CENTER_OPEN': {
      return {
        ...state,
        isNotificationCenterOpen: action.payload
      };
    }

    case 'SET_HISTORY': {
      return {
        ...state,
        history: action.payload
      };
    }

    default:
      return state;
  }
}

export function ToastProvider({ children, onNavigateTab = () => {} }) {
  const [state, dispatch] = useReducer(toastReducer, initialState);
  const titleIntervalRef = useRef(null);
  const originalTitleRef = useRef(typeof document !== 'undefined' ? document.title : 'PRIME OS');

  // Sonidos y Vibraciones al añadir un toast
  const triggerAudioAndHaptics = useCallback((toastData) => {
    const { type, category } = toastData;

    // Vibración háptica en móvil
    if (state.settings.vibrationEnabled) {
      if (type === 'critical') {
        haptics.restDone();
      } else if (type === 'achievement' || type === 'logro') {
        haptics.outlierAchievement();
      } else if (category === 'water') {
        haptics.waterGoal();
      } else {
        haptics.seriesDone();
      }
    }

    // Audio sintetizado
    if (state.settings.soundEnabled) {
      if (type === 'critical') {
        sounds.playDuolingoAlarmSound();
      } else if (type === 'achievement' || type === 'logro') {
        sounds.playSuccessChime();
      } else if (category === 'water') {
        sounds.playWaterDropSound();
      } else {
        sounds.playToastChime();
      }
    }
  }, [state.settings.soundEnabled, state.settings.vibrationEnabled]);

  // Manejo del título parpadeante para toasts críticos
  const hasCriticalToast = state.toasts.some((t) => t.type === 'critical');

  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (hasCriticalToast) {
      if (!titleIntervalRef.current) {
        let toggle = false;
        titleIntervalRef.current = setInterval(() => {
          document.title = toggle ? '(1) ⚡ PRIME' : '⚠️ ¡Alerta Prime!';
          toggle = !toggle;
        }, 1000);
      }
    } else {
      if (titleIntervalRef.current) {
        clearInterval(titleIntervalRef.current);
        titleIntervalRef.current = null;
        document.title = originalTitleRef.current || 'PRIME OS - Dashboard de Rendimiento';
      }
    }

    return () => {
      if (titleIntervalRef.current) {
        clearInterval(titleIntervalRef.current);
        titleIntervalRef.current = null;
      }
    };
  }, [hasCriticalToast]);

  // API pública de toasts
  const addToast = useCallback((options) => {
    const normalized = typeof options === 'string' ? { title: options } : options;
    const toastType = normalized.type || 'info';

    // Duración configurada o default
    const duration = normalized.duration !== undefined
      ? normalized.duration
      : state.settings.duration;

    const payload = {
      ...normalized,
      type: toastType,
      duration
    };

    triggerAudioAndHaptics(payload);
    dispatch({ type: 'ADD_TOAST', payload });
    return payload.id;
  }, [state.settings.duration, triggerAudioAndHaptics]);

  const removeToast = useCallback((id) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  }, []);

  const clearToasts = useCallback(() => {
    dispatch({ type: 'DISMISS_ALL' });
  }, []);

  const confirmReminder = useCallback(async (id, onDoneAction = null) => {
    if (onDoneAction) {
      try { await onDoneAction(); } catch (_) {}
    }
    await notificationsApi.confirmReminder(id);
    removeToast(id);
    dispatch({ type: 'SET_HISTORY', payload: notificationsApi.getHistory() });
    haptics.seriesDone();
    sounds.playSuccessChime();
  }, [removeToast]);

  const snoozeReminder = useCallback(async (toastItem, minutes = 10) => {
    const id = toastItem.id;
    const currentCount = state.snoozeCounts[id] || 0;
    if (currentCount >= 3) return; // Máximo 3 veces

    dispatch({ type: 'INCREMENT_SNOOZE', payload: { id } });
    await notificationsApi.snoozeReminder(id, minutes, currentCount + 1);
    removeToast(id);
    dispatch({ type: 'SET_HISTORY', payload: notificationsApi.getHistory() });

    // Programar reaparición del toast en minutos (por practicidad en app abierta)
    setTimeout(() => {
      addToast({
        ...toastItem,
        id,
        title: `⏰ (Pospuesto) ${toastItem.title}`,
        persistent: false,
        duration: state.settings.duration
      });
    }, minutes * 60 * 1000);
  }, [state.snoozeCounts, removeToast, addToast, state.settings.duration]);

  const markAllAsRead = useCallback(() => {
    const updated = notificationsApi.markAllAsRead();
    dispatch({ type: 'SET_HISTORY', payload: updated });
  }, []);

  const clearHistory = useCallback(() => {
    const updated = notificationsApi.clearHistory();
    dispatch({ type: 'SET_HISTORY', payload: updated });
  }, []);

  const updateSettings = useCallback((newSettings) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
  }, []);

  const setIsNotificationCenterOpen = useCallback((open) => {
    dispatch({ type: 'SET_NOTIFICATION_CENTER_OPEN', payload: open });
  }, []);

  // Objeto con métodos canónicos según requerimiento:
  // toast.success | error | warning | info | achievement | reminder | critical | undo
  const toast = useCallback((opts) => addToast(opts), [addToast]);

  toast.success = (opts) => addToast({ ...normalizeOpts(opts), type: 'success' });
  toast.error = (opts) => addToast({ ...normalizeOpts(opts), type: 'error' });
  toast.warning = (opts) => addToast({ ...normalizeOpts(opts), type: 'warning' });
  toast.info = (opts) => addToast({ ...normalizeOpts(opts), type: 'info' });
  toast.achievement = (opts) => addToast({ ...normalizeOpts(opts), type: 'achievement' });
  toast.logro = toast.achievement;
  toast.reminder = (opts) => addToast({ ...normalizeOpts(opts), type: 'reminder' });
  toast.critical = (opts) => addToast({ ...normalizeOpts(opts), type: 'critical', persistent: true });
  toast.undo = ({ title, message, onUndo, duration = 6000, category = 'system' }) =>
    addToast({
      title,
      message,
      type: 'warning',
      duration,
      category,
      actions: [
        {
          label: 'Deshacer',
          variant: 'primary',
          onClick: onUndo
        }
      ]
    });
  toast.dismiss = removeToast;
  toast.clear = clearToasts;

  const unreadCount = state.history.filter((h) => !h.read).length;

  const value = {
    toast,
    addToast,
    removeToast,
    clearToasts,
    toasts: state.toasts,
    history: state.history,
    unreadCount,
    settings: state.settings,
    updateSettings,
    isNotificationCenterOpen: state.isNotificationCenterOpen,
    setIsNotificationCenterOpen,
    confirmReminder,
    snoozeReminder,
    markAllAsRead,
    clearHistory,
    snoozeCounts: state.snoozeCounts,
    onNavigateTab
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

function normalizeOpts(opts) {
  return typeof opts === 'string' ? { title: opts } : opts;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser usado dentro de un <ToastProvider>');
  }
  return context;
}
