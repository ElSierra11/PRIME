/**
 * useReminders.js — Hook para recepción de recordatorios en tiempo real
 *
 * Características:
 * 1. Escucha eventos del servidor con SSE (Server-Sent Events) hacia /api/notifications/stream.
 * 2. Si falla o no está disponible, activa polling cada 30 segundos como fallback.
 * 3. Reconexión automática con retroceso exponencial (backoff de 1s a 30s).
 * 4. Deduplicación por id contra los recordatorios de los últimos 30 minutos.
 * 5. Si la app está visible y enfocada: muestra el toast interactivo y marca entregado en app
 *    (markDeliveredInApp) para cancelar el escalamiento a Web Push.
 * 6. Si la pestaña está oculta: no genera toast visual para evitar duplicados con el aviso del sistema.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useToast } from './useToast';
import { notificationsApi } from '../services/notificationsApi';

export function useReminders({ onAction = () => {} } = {}) {
  const { toast, confirmReminder, snoozeReminder, onNavigateTab } = useToast();
  const seenReminderIdsRef = useRef(new Set());
  const disconnectStreamRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const backoffDelayRef = useRef(1000); // 1s inicial

  /**
   * Procesa un recordatorio entrante
   */
  const handleIncomingReminder = useCallback((reminder) => {
    if (!reminder || !reminder.id) return;

    // Deduplicación en memoria
    if (seenReminderIdsRef.current.has(reminder.id)) {
      return;
    }
    seenReminderIdsRef.current.add(reminder.id);

    // Comprobar visibilidad de la pestaña
    const isAppVisible = typeof document !== 'undefined' && document.visibilityState === 'visible';
    const isAppFocused = typeof document !== 'undefined' && document.hasFocus();

    // Solo mostrar toast dentro de la app si está visible
    if (isAppVisible) {
      // Notificar al servidor que ya fue entregado dentro de la app
      notificationsApi.markDeliveredInApp(reminder.id);

      const isCritical = reminder.priority === 'critical' || reminder.type === 'critical';

      const toastConfig = {
        id: reminder.id,
        title: reminder.title,
        message: reminder.message,
        category: reminder.category || 'habits',
        tab: reminder.tab,
        persistent: isCritical,
        critical: isCritical,
        actions: [
          {
            label: 'Hecho',
            variant: 'primary',
            onClick: () => {
              confirmReminder(reminder.id, async () => {
                if (reminder.actionType && onAction) {
                  onAction(reminder.actionType, reminder.actionPayload);
                }
              });
            }
          },
          {
            label: 'Posponer 10 min',
            variant: 'secondary',
            onClick: () => {
              snoozeReminder(reminder, 10);
            }
          },
          ...(reminder.tab
            ? [
                {
                  label: 'Abrir',
                  variant: 'ghost',
                  onClick: () => {
                    if (onNavigateTab) onNavigateTab(reminder.tab);
                  }
                }
              ]
            : [])
        ]
      };

      if (isCritical) {
        toast.critical(toastConfig);
      } else {
        toast.reminder(toastConfig);
      }
    }
  }, [toast, confirmReminder, snoozeReminder, onNavigateTab, onAction]);

  /**
   * Recupera recordatorios pendientes de los últimos 30 minutos sin duplicados
   */
  const fetchPendingReminders = useCallback(async () => {
    try {
      const pending = await notificationsApi.getPendingReminders(30);
      if (Array.isArray(pending)) {
        pending.forEach((rem) => handleIncomingReminder(rem));
      }
    } catch (_) {}
  }, [handleIncomingReminder]);

  /**
   * Conecta o reconecta el stream SSE con backoff exponencial
   */
  const connectSSE = useCallback(() => {
    // Limpiar timeout previo si lo hay
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Desconectar previo
    if (disconnectStreamRef.current) {
      disconnectStreamRef.current();
      disconnectStreamRef.current = null;
    }

    disconnectStreamRef.current = notificationsApi.connectStream(
      (reminder) => {
        // Al recibir un evento con éxito, resetear backoff
        backoffDelayRef.current = 1000;
        handleIncomingReminder(reminder);
      },
      (_err) => {
        // En caso de error, programar reconexión con backoff
        const delay = backoffDelayRef.current;
        backoffDelayRef.current = Math.min(backoffDelayRef.current * 2, 30000); // máx 30s

        reconnectTimeoutRef.current = setTimeout(() => {
          connectSSE();
          // Recuperar pendientes acumulados durante la desconexión
          fetchPendingReminders();
        }, delay);
      }
    );
  }, [handleIncomingReminder, fetchPendingReminders]);

  useEffect(() => {
    // 1. Cargar pendientes iniciales
    fetchPendingReminders();

    // 2. Conectar stream SSE
    connectSSE();

    // 3. Fallback polling cada 30s
    pollingIntervalRef.current = setInterval(() => {
      fetchPendingReminders();
    }, 30000);

    // 4. Si la pestaña vuelve a ser visible, chequear pendientes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchPendingReminders();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (disconnectStreamRef.current) disconnectStreamRef.current();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connectSSE, fetchPendingReminders]);

  return {
    fetchPendingReminders
  };
}
