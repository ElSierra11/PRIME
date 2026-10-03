/**
 * Notifications Microservice - PRIME OS
 * Handles SSE streams, in-app reminder dispatch, snooze management,
 * confirmations, and delivery tracking.
 */

// Active SSE client connections
const sseClients = new Set();

// In-memory notifications store (persisted or populated from reminders)
let remindersHistory = [
  {
    id: 'sample-welcome',
    category: 'prime',
    type: 'reminder',
    title: 'Centro de Notificaciones PRIME',
    message: 'Sistema unificado listo para gestionar tus recordatorios de hábitos, agua, sueño y Outlier.',
    timestamp: new Date().toISOString(),
    status: 'confirmed',
    tab: 'dashboard'
  }
];

// Active pending reminders (last 30 minutes)
let pendingReminders = [];

/**
 * Register a client for Server-Sent Events (SSE)
 */
function handleSSEStream(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'X-Accel-Buffering': 'no'
  });

  res.write(': connected to PRIME OS notification stream\n\n');

  sseClients.add(res);

  // Heartbeat to keep connection alive through proxies
  const heartbeatInterval = setInterval(() => {
    if (!res.writableEnded) {
      res.write(': keep-alive\n\n');
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeatInterval);
    sseClients.delete(res);
  });
}

/**
 * Broadcast an event to all connected SSE clients
 */
function broadcast(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (_) {
      sseClients.delete(client);
    }
  }
}

/**
 * Send a reminder through SSE stream and queue it in pending
 */
function sendReminder(reminder) {
  const item = {
    id: reminder.id || `rem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    title: reminder.title || 'Recordatorio PRIME',
    message: reminder.message || '',
    category: reminder.category || 'prime',
    type: reminder.type || 'reminder',
    tab: reminder.tab || 'dashboard',
    priority: reminder.priority ?? 2,
    timestamp: new Date().toISOString(),
    status: 'pending',
    snoozeCount: 0,
    ...reminder
  };

  pendingReminders.push(item);
  remindersHistory.unshift(item);

  // Broadcast to all active browsers
  broadcast('reminder', item);

  return item;
}

/**
 * Get pending reminders from the last 30 minutes
 */
function getPendingReminders(minutes = 30) {
  const threshold = Date.now() - minutes * 60 * 1000;
  return pendingReminders.filter(r => {
    const t = new Date(r.timestamp).getTime();
    return t >= threshold && r.status === 'pending';
  });
}

/**
 * Confirm a reminder (user clicked "Hecho")
 * TODO: Enforce cancellation of escalation channels (SMS, WebPush, Email)
 */
function confirmReminder(id, actionData = {}) {
  const reminder = pendingReminders.find(r => r.id === id);
  if (reminder) {
    reminder.status = 'confirmed';
    reminder.confirmedAt = new Date().toISOString();
    reminder.actionData = actionData;
  }

  // Also update in history
  const hist = remindersHistory.find(r => r.id === id);
  if (hist) {
    hist.status = 'confirmed';
    hist.confirmedAt = new Date().toISOString();
  }

  // Clean from active pending list
  pendingReminders = pendingReminders.filter(r => r.id !== id);

  broadcast('confirmed', { id, actionData });
  return { success: true, id, status: 'confirmed' };
}

/**
 * Snooze a reminder for X minutes (up to 3 times max)
 * TODO: Schedule actual timer or background worker to re-emit when time expires
 */
function snoozeReminder(id, minutes = 10, currentCount = 0) {
  const reminder = pendingReminders.find(r => r.id === id) || remindersHistory.find(r => r.id === id);
  const newCount = (reminder?.snoozeCount || currentCount || 0) + 1;

  if (newCount > 3) {
    return { success: false, message: 'Límite de 3 posposiciones alcanzado', count: newCount };
  }

  const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();

  if (reminder) {
    reminder.status = 'snoozed';
    reminder.snoozeCount = newCount;
    reminder.snoozeUntil = snoozeUntil;
  }

  broadcast('snoozed', { id, minutes, snoozeUntil, snoozeCount: newCount });

  // Re-emit automatically after delay
  setTimeout(() => {
    if (reminder && reminder.status === 'snoozed') {
      reminder.status = 'pending';
      reminder.timestamp = new Date().toISOString();
      broadcast('reminder', reminder);
    }
  }, minutes * 60 * 1000);

  return { success: true, id, snoozeUntil, snoozeCount: newCount };
}

/**
 * Mark a reminder as delivered in-app to suppress duplicate WebPush notifications
 * TODO: Connect to Push Notification server to evict or skip the push message for this device
 */
function markDeliveredInApp(id) {
  const reminder = pendingReminders.find(r => r.id === id);
  if (reminder) {
    reminder.deliveredInApp = true;
    reminder.deliveredAt = new Date().toISOString();
  }
  return { success: true, id, deliveredInApp: true };
}

/**
 * Retrieve notification history (last 7 days)
 */
function getHistory(days = 7) {
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
  return remindersHistory.filter(r => new Date(r.timestamp).getTime() >= threshold);
}

/**
 * Clear notification history
 */
function clearHistory() {
  remindersHistory = [];
  return { success: true };
}

module.exports = {
  handleSSEStream,
  sendReminder,
  getPendingReminders,
  confirmReminder,
  snoozeReminder,
  markDeliveredInApp,
  getHistory,
  clearHistory
};
