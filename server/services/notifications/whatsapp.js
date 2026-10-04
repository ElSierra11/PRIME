/**
 * Microservice: WhatsApp Notification Engine - PRIME OS
 * Handles automated and on-demand notifications via:
 * 1. CallMeBot WhatsApp API (100% free, personal bot, no credit card required)
 * 2. Twilio WhatsApp API (standard enterprise provider)
 * 3. Custom Webhook (Evolution API, Baileys, Z-API)
 * 4. Fallback Click-to-Chat deep links
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const supabase = require('../supabase');

const CONFIG_FILE = path.join(__dirname, 'whatsapp_config.json');

const DEFAULT_CONFIG = {
  enabled: true,
  provider: 'callmebot', // 'callmebot' | 'twilio' | 'webhook'
  phone: '573000000000',  // Alejo Sierra phone
  apiKey: '',             // CallMeBot API Key
  notify15MinBefore: true,
  notifyAtStart: true,
  notifyBedtime: true,
  twilioAccountSid: '',
  twilioAuthToken: '',
  twilioFrom: 'whatsapp:+14155238886',
  webhookUrl: ''
};

class WhatsAppService {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        return { ...DEFAULT_CONFIG, ...data };
      }
    } catch (e) {
      console.error('Error cargando whatsapp_config.json:', e);
    }
    return { ...DEFAULT_CONFIG };
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf8');
    } catch (e) {
      console.error('Error guardando whatsapp_config.json:', e);
    }

    if (supabase && supabase.isConfigured()) {
      supabase.insert('app_settings', {
        id: 'whatsapp_config',
        settings: this.config,
        updated_at: new Date().toISOString()
      }).catch(() => {});
    }

    return this.getPublicConfig();
  }

  getPublicConfig() {
    return {
      enabled: Boolean(this.config.enabled),
      provider: this.config.provider || 'callmebot',
      phone: this.config.phone || '',
      hasApiKey: Boolean(this.config.apiKey && this.config.apiKey.trim().length > 0),
      apiKeyMasked: this.config.apiKey ? `****${this.config.apiKey.slice(-4)}` : '',
      notify15MinBefore: this.config.notify15MinBefore !== false,
      notifyAtStart: this.config.notifyAtStart !== false,
      notifyBedtime: this.config.notifyBedtime !== false,
      hasTwilio: Boolean(this.config.twilioAccountSid && this.config.twilioAuthToken),
      hasWebhook: Boolean(this.config.webhookUrl)
    };
  }

  cleanPhoneNumber(phoneStr) {
    if (!phoneStr) return '';
    let cleaned = phoneStr.replace(/\D/g, '');
    // If Colombian mobile starts without 57, prepend 57
    if (cleaned.length === 10 && cleaned.startsWith('3')) {
      cleaned = '57' + cleaned;
    }
    return cleaned;
  }

  /**
   * Send WhatsApp message via CallMeBot API
   */
  sendViaCallMeBot(phone, apiKey, text) {
    return new Promise((resolve) => {
      const cleanPhone = this.cleanPhoneNumber(phone);
      if (!cleanPhone || !apiKey) {
        return resolve({ success: false, error: 'Falta teléfono o API Key de CallMeBot' });
      }

      const encodedText = encodeURIComponent(text);
      const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedText}&apikey=${encodeURIComponent(apiKey.trim())}`;

      https.get(url, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, provider: 'callmebot', response: body });
          } else {
            resolve({ success: false, provider: 'callmebot', status: res.statusCode, error: body });
          }
        });
      }).on('error', (err) => {
        resolve({ success: false, provider: 'callmebot', error: err.message });
      });
    });
  }

  /**
   * Send WhatsApp message via Twilio REST API
   */
  sendViaTwilio(toPhone, text) {
    return new Promise((resolve) => {
      const { twilioAccountSid, twilioAuthToken, twilioFrom } = this.config;
      if (!twilioAccountSid || !twilioAuthToken) {
        return resolve({ success: false, error: 'Credenciales de Twilio no configuradas' });
      }

      const cleanPhone = this.cleanPhoneNumber(toPhone);
      const postData = new URLSearchParams({
        From: twilioFrom || 'whatsapp:+14155238886',
        To: `whatsapp:+${cleanPhone}`,
        Body: text
      }).toString();

      const auth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');

      const options = {
        hostname: 'api.twilio.com',
        port: 443,
        path: `/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, provider: 'twilio' });
          } else {
            resolve({ success: false, provider: 'twilio', status: res.statusCode, error: body });
          }
        });
      });

      req.on('error', (err) => resolve({ success: false, provider: 'twilio', error: err.message }));
      req.write(postData);
      req.end();
    });
  }

  /**
   * Send WhatsApp message via custom Webhook
   */
  sendViaWebhook(webhookUrl, toPhone, text) {
    return new Promise((resolve) => {
      try {
        const u = new URL(webhookUrl);
        const payload = JSON.stringify({
          phone: this.cleanPhoneNumber(toPhone),
          message: text,
          timestamp: new Date().toISOString()
        });

        const client = u.protocol === 'https:' ? https : http;
        const req = client.request(u, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        }, (res) => {
          resolve({ success: res.statusCode >= 200 && res.statusCode < 300 });
        });

        req.on('error', (e) => resolve({ success: false, error: e.message }));
        req.write(payload);
        req.end();
      } catch (err) {
        resolve({ success: false, error: err.message });
      }
    });
  }

  /**
   * Main dispatch method
   */
  async sendMessage(text, options = {}) {
    if (!this.config.enabled) {
      return { success: false, skipped: true, reason: 'WhatsApp deshabilitado en configuración' };
    }

    const phone = options.phone || this.config.phone;
    const provider = options.provider || this.config.provider;

    if (!phone) {
      return {
        success: false,
        notConfigured: true,
        message: 'No hay número de teléfono guardado para WhatsApp'
      };
    }

    if (provider === 'callmebot') {
      if (!this.config.apiKey) {
        return {
          success: false,
          notConfigured: true,
          message: 'Falta la API Key de CallMeBot. Actívala en el modal de WhatsApp en 30 segundos.'
        };
      }
      return await this.sendViaCallMeBot(phone, this.config.apiKey, text);
    }

    if (provider === 'twilio') {
      return await this.sendViaTwilio(phone, text);
    }

    if (provider === 'webhook') {
      return await this.sendViaWebhook(this.config.webhookUrl, phone, text);
    }

    return { success: false, error: 'Proveedor desconocido' };
  }

  /**
   * Format message for upcoming calendar event (15 min before)
   */
  formatEvent15MinMessage(event) {
    const categoryIcons = {
      university: '🎓 [UNIVERSIDAD]',
      thesis: '📜 [TESIS / TRABAJO DE GRADO]',
      referee: '⚽ [ARBITRAJE COARC]',
      gym: '💪 [GYM PRIME 60M]',
      outlier: '💻 [OUTLIER DEEP WORK]',
      family: '👨‍👩‍👧 [FAMILIA / TERAPIAS]',
      rest: '🌙 [RECUPERACIÓN / DESCANSO]'
    };

    const catLabel = categoryIcons[event.category] || '⚡ [COMPROMISO PRIME]';

    return (
      `⚡ *PRIME OS - EN 15 MINUTOS*\n\n` +
      `📌 *${event.title}*\n` +
      `🏷️ ${catLabel}\n` +
      `⏰ Horario: *${event.start}* a *${event.end}*\n` +
      (event.notes ? `📝 Notas: _${event.notes}_\n\n` : `\n`) +
      `🔥 ¡Momento de alistarte y mantener la disciplina, Alejo!`
    );
  }

  /**
   * Format message for event starting right now
   */
  formatEventStartMessage(event) {
    return (
      `🚀 *PRIME OS - COMIENZA AHORA*\n\n` +
      `🎯 *${event.title}*\n` +
      `⏰ De *${event.start}* a *${event.end}*\n` +
      (event.notes ? `📍 _${event.notes}_\n\n` : `\n`) +
      `¡Modo Prime activado! 100% de enfoque.`
    );
  }

  /**
   * Format message for 10:00 PM Duolingo Sleep Alarm
   */
  formatBedtimeMessage() {
    return (
      `🦉 *PRIME OS - MODO DISCIPLINA (10:00 PM)*\n\n` +
      `¡Hora de dormir, Alejo! 🛑\n\n` +
      `Apaga pantallas y ve a descansar para garantizar tus 7.5 horas de recuperación. ` +
      `Tu cerebro de ingeniero y tu físico de árbitro necesitan descanso de calidad para estar en su PRIME mañana.\n\n` +
      `💤 ¡Buenas noches!`
    );
  }

  /**
   * Format daily summary message
   */
  formatDailySummaryMessage(events, dayName) {
    const dayStr = dayName ? dayName.toUpperCase() : 'HOY';
    if (!events || events.length === 0) {
      return (
        `📋 *PRIME OS - AGENDA DE ${dayStr}*\n\n` +
        `No tienes compromisos registrados para este día. ¡Buen momento para descansar o avanzar en la tesis!`
      );
    }

    let msg = `📋 *PRIME OS - AGENDA DE ${dayStr}*\n` +
              `Total compromisos: *${events.length}*\n\n`;

    events.forEach((ev, i) => {
      msg += `${i + 1}. *${ev.start} - ${ev.end}* ➜ ${ev.title}\n`;
      if (ev.notes) msg += `   ↳ _${ev.notes}_\n`;
    });

    msg += `\n🎯 ¡A dominar el día con disciplina, Alejo!`;
    return msg;
  }
}

module.exports = new WhatsAppService();
