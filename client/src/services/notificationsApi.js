/**
 * notificationsApi.js — Capa de API para el sistema de recordatorios y notificaciones de PRIME OS
 *
 * Proporciona:
 * - Conexión SSE (Server-Sent Events) para recibir recordatorios en tiempo real.
 * - Confirmación y posposición de recordatorios.
 * - Registro de entrega en la app (para suprimir Web Push duplicado cuando la app está abierta).
 * - Historial de notificaciones persistente (los últimos 7 días).
 *
 * NOTA DE ARQUITECTURA:
 * Si los endpoints del servidor no están disponibles o fallan, opera de manera resiliente
 * con almacenamiento local (localStorage) y simulación, documentando los TODOs para el backend.
 */

const STORAGE_HISTORY_KEY = 'prime_notifications_history';
const STORAGE_PENDING_KEY = 'prime_pending_reminders';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

class NotificationsApiService {
  /**
   * Obtiene los recordatorios pendientes de los últimos 30 minutos
   * TODO Backend: GET /api/notifications/pending?since={timestamp}
   */
  async getPendingReminders(sinceMinutes = 30) {
    try {
      const sinceTimestamp = Date.now() - sinceMinutes * 60 * 1000;
      const res = await fetch(`/api/notifications/pending?since=${sinceTimestamp}`, {
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.reminders)) {
          return data.reminders;
        }
      }
    } catch (_) {
      // Fallback a almacenamiento local simulado
    }

    // Fallback local: recuperar recordatorios pendientes almacenados
    return this._getLocalPendingReminders();
  }

  /**
   * Informa al servidor que el recordatorio fue entregado en la app abierta.
   * Esto cancela el escalamiento a Web Push en segundo plano.
   * TODO Backend: POST /api/notifications/delivered { id, timestamp }
   */
  async markDeliveredInApp(reminderId) {
    if (!reminderId) return;
    try {
      await fetch('/api/notifications/delivered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reminderId, timestamp: Date.now() })
      });
    } catch (_) {
      // Silencioso: si no hay servidor, la app sigue funcionando
    }
  }

  /**
   * Confirma la ejecución de un recordatorio ("Hecho").
   * Cancela cualquier reintento o escalamiento a otros canales.
   * TODO Backend: POST /api/notifications/confirm { id, confirmedAt }
   */
  async confirmReminder(reminderId) {
    if (!reminderId) return;
    try {
      await fetch('/api/notifications/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reminderId, confirmedAt: Date.now() })
      });
    } catch (_) {}

    this._removeLocalPendingReminder(reminderId);
    this._updateHistoryItemStatus(reminderId, 'confirmed');
  }

  /**
   * Pospone un recordatorio por N minutos (máximo 3 veces).
   * TODO Backend: POST /api/notifications/snooze { id, minutes, count }
   */
  async snoozeReminder(reminderId, minutes = 10, snoozeCount = 1) {
    if (!reminderId) return;
    try {
      await fetch('/api/notifications/snooze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reminderId, minutes, count: snoozeCount })
      });
    } catch (_) {}

    this._updateHistoryItemStatus(reminderId, 'snoozed');
  }

  /**
   * Inicia el stream en vivo de Server-Sent Events (SSE) hacia /api/notifications/stream.
   * Devuelve una función para desconectar el stream.
   * TODO Backend: GET /api/notifications/stream (Content-Type: text/event-stream)
   */
  connectStream(onReminder, onError) {
    let eventSource = null;
    let isClosed = false;

    try {
      if (typeof window !== 'undefined' && 'EventSource' in window) {
        eventSource = new EventSource('/api/notifications/stream');

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && onReminder) {
              onReminder(data);
            }
          } catch (e) {
            console.warn('Error parseando SSE de recordatorios:', e);
          }
        };

        eventSource.addEventListener('reminder', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && onReminder) onReminder(data);
          } catch (_) {}
        });

        eventSource.onerror = (err) => {
          if (onError && !isClosed) onError(err);
        };
      } else {
        if (onError) onError(new Error('EventSource no soportado en este navegador'));
      }
    } catch (err) {
      if (onError) onError(err);
    }

    return () => {
      isClosed = true;
      if (eventSource) {
        eventSource.close();
      }
    };
  }

  /**
   * Obtiene el historial de los últimos 7 días.
   * TODO Backend: GET /api/notifications/history?days=7
   */
  getHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (!raw) return [];
      const list = JSON.parse(raw);
      const cutoff = Date.now() - SEVEN_DAYS_MS;
      // Filtrar menores a 7 días y ordenar del más reciente al más antiguo
      const filtered = list.filter((item) => (item.timestamp || 0) >= cutoff);
      if (filtered.length !== list.length) {
        localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(filtered));
      }
      return filtered;
    } catch (_) {
      return [];
    }
  }

  /**
   * Guarda un nuevo ítem en el historial
   */
  saveHistoryItem(item) {
    try {
      const history = this.getHistory();
      const existingIdx = history.findIndex((h) => h.id === item.id);
      const normalizedItem = {
        ...item,
        timestamp: item.timestamp || Date.now(),
        read: item.read !== undefined ? item.read : false,
        status: item.status || 'delivered' // 'delivered' | 'confirmed' | 'snoozed' | 'dismissed'
      };

      if (existingIdx >= 0) {
        history[existingIdx] = { ...history[existingIdx], ...normalizedItem };
      } else {
        history.unshift(normalizedItem);
      }

      // Máximo 100 registros en local
      const trimmed = history.slice(0, 100);
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(trimmed));
      return trimmed;
    } catch (_) {
      return [];
    }
  }

  /**
   * Marca todas las notificaciones como leídas
   */
  markAllAsRead() {
    try {
      const history = this.getHistory();
      const updated = history.map((item) => ({ ...item, read: true }));
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(updated));
      return updated;
    } catch (_) {
      return [];
    }
  }

  /**
   * Limpia todo el historial
   */
  clearHistory() {
    try {
      localStorage.removeItem(STORAGE_HISTORY_KEY);
      return [];
    } catch (_) {
      return [];
    }
  }

  // ─── Helpers locales ────────────────────────────────────

  _getLocalPendingReminders() {
    try {
      const raw = localStorage.getItem(STORAGE_PENDING_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  _removeLocalPendingReminder(id) {
    try {
      const list = this._getLocalPendingReminders().filter((r) => r.id !== id);
      localStorage.setItem(STORAGE_PENDING_KEY, JSON.stringify(list));
    } catch (_) {}
  }

  _updateHistoryItemStatus(id, status) {
    try {
      const history = this.getHistory();
      const item = history.find((h) => h.id === id);
      if (item) {
        item.status = status;
        localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history));
      }
    } catch (_) {}
  }
}

export const notificationsApi = new NotificationsApiService();
