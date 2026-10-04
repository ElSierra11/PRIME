/**
 * Microservice: Background Reminder Scheduler - PRIME OS
 * Continuously evaluates current time (America/Bogota timezone)
 * and triggers:
 * 1. 15-Minute Calendar Alerts (Push, SSE, WhatsApp)
 * 2. Event Start Alerts (Push, SSE, WhatsApp)
 * 3. 10:00 PM Duolingo Sleep Alarms (Push, SSE, WhatsApp)
 */

const scheduleService = require('../schedule/service');
const notificationsService = require('./service');
const whatsappService = require('./whatsapp');
const pushService = require('./push');

class ReminderScheduler {
  constructor() {
    this.sentAlerts = new Set();
    this.timer = null;
    this.isRunning = false;
  }

  getColombiaNow() {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(new Date());
    const map = {};
    parts.forEach(p => { map[p.type] = p.value; });

    const dayOfWeekFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Bogota',
      weekday: 'short'
    });
    const weekdayStr = dayOfWeekFormatter.format(new Date());
    const dayMap = { 'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3, 'Fri': 4, 'Sat': 5, 'Sun': 6 };
    const dayIndex = dayMap[weekdayStr] !== undefined ? dayMap[weekdayStr] : 0;

    const hours = parseInt(map.hour, 10);
    const minutes = parseInt(map.minute, 10);
    const dateStr = `${map.year}-${map.month}-${map.day}`;
    const timeMinutes = hours * 60 + minutes;

    return { hours, minutes, dateStr, timeMinutes, dayIndex };
  }

  timeStrToMinutes(str) {
    if (!str) return 0;
    const [h, m] = str.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('⏰ PRIME OS Scheduler de Recordatorios iniciado (Timezone: America/Bogota).');

    // Run check immediately, then every 30 seconds
    this.check();
    this.timer = setInterval(() => this.check(), 30000);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  async check() {
    try {
      const { hours, minutes, dateStr, timeMinutes, dayIndex } = this.getColombiaNow();

      // Clean old alerts from previous days to keep memory clean
      if (this.sentAlerts.size > 200) {
        for (const key of this.sentAlerts) {
          if (!key.includes(dateStr)) {
            this.sentAlerts.delete(key);
          }
        }
      }

      // 1. Bedtime check (22:00 / 10:00 PM)
      const bedtimeKey = `bedtime-${dateStr}`;
      if (hours === 22 && minutes <= 2 && !this.sentAlerts.has(bedtimeKey)) {
        this.sentAlerts.add(bedtimeKey);
        await this.dispatchBedtimeAlert();
      }

      // 2. Calendar events check for today
      const scheduleData = await scheduleService.getEventsByDay(dayIndex);
      const events = scheduleData?.events || [];

      for (const event of events) {
        const startMin = this.timeStrToMinutes(event.start);

        // A) 15-Minute reminder
        const alert15Key = `15m-${event.id}-${dateStr}`;
        if (timeMinutes >= startMin - 15 && timeMinutes < startMin - 13 && !this.sentAlerts.has(alert15Key)) {
          this.sentAlerts.add(alert15Key);
          await this.dispatchEventAlert(event, 15);
        }

        // B) Start now reminder
        const alertStartKey = `start-${event.id}-${dateStr}`;
        if (timeMinutes >= startMin && timeMinutes <= startMin + 2 && !this.sentAlerts.has(alertStartKey)) {
          this.sentAlerts.add(alertStartKey);
          await this.dispatchEventAlert(event, 0);
        }
      }
    } catch (err) {
      console.error('Error en ciclo del Scheduler:', err);
    }
  }

  async dispatchEventAlert(event, minutesRemaining) {
    const is15Min = minutesRemaining > 0;
    const title = is15Min ? `⚡ En 15 min: ${event.title}` : `🚀 ¡Iniciando ahora! ${event.title}`;
    const body = `${event.start} - ${event.end} • ${event.notes || 'Compromiso PRIME'}`;

    console.log(`[Scheduler] Disparando alerta de evento (${is15Min ? '15m' : 'inicio'}): ${event.title}`);

    // 1. In-App SSE Notification
    notificationsService.sendReminder({
      title,
      message: body,
      category: event.category || 'schedule',
      type: 'event_reminder',
      tab: 'schedule',
      priority: is15Min ? 2 : 1,
      eventId: event.id
    });

    // 2. Web Push Notification (PWA / Mobile / Background)
    pushService.sendPushNotification({
      title,
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: `event-${event.id}-${is15Min ? '15m' : 'start'}`,
      url: '/?tab=schedule'
    }).catch(e => console.warn('Error enviando push:', e.message));

    // 3. WhatsApp Notification
    const waConfig = whatsappService.config;
    if (waConfig.enabled && ((is15Min && waConfig.notify15MinBefore) || (!is15Min && waConfig.notifyAtStart))) {
      const message = is15Min
        ? whatsappService.formatEvent15MinMessage(event)
        : whatsappService.formatEventStartMessage(event);

      whatsappService.sendMessage(message).then(res => {
        if (res.success) {
          console.log(`[Scheduler] WhatsApp enviado para evento: ${event.title}`);
        } else if (res.notConfigured) {
          // Normal if not yet configured with apiKey
        } else {
          console.warn(`[Scheduler] WhatsApp falló:`, res.error || res.message);
        }
      }).catch(err => console.error('[Scheduler] Error en WhatsApp dispatch:', err));
    }
  }

  async dispatchBedtimeAlert() {
    console.log('[Scheduler] Disparando Alarma de Sueño 10:00 PM');

    const title = '🦉 MODO TÓXICO: ¡A DORMIR, ALEJO!';
    const body = 'Son las 10:00 PM. Apaga pantallas y descansa para rendir al 100% mañana.';

    // 1. In-App SSE
    notificationsService.sendReminder({
      title,
      message: body,
      category: 'habits',
      type: 'duolingo_sleep',
      tab: 'dashboard',
      priority: 1
    });

    // 2. Web Push
    pushService.sendPushNotification({
      title,
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'prime-duolingo-alarm',
      url: '/?tab=dashboard'
    }).catch(e => console.warn('Error enviando push de sueño:', e.message));

    // 3. WhatsApp
    const waConfig = whatsappService.config;
    if (waConfig.enabled && waConfig.notifyBedtime) {
      whatsappService.sendMessage(whatsappService.formatBedtimeMessage()).then(res => {
        if (res.success) {
          console.log('[Scheduler] WhatsApp de Sueño enviado a Alejo');
        }
      }).catch(e => console.error('[Scheduler] Error enviando WhatsApp de sueño:', e));
    }
  }
}

module.exports = new ReminderScheduler();
