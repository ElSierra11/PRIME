/**
 * Microservice: Web Push Notification Engine (VAPID) - PRIME OS
 * Enables real background push notifications to PWA and mobile devices (Android / iOS 16.4+).
 */

const fs = require('fs');
const path = require('path');
let webpush;
try {
  webpush = require('web-push');
} catch (e) {
  console.warn('web-push package no instalado o falló al cargar:', e.message);
}

const VAPID_FILE = path.join(__dirname, 'vapid_keys.json');
const SUBS_FILE = path.join(__dirname, 'push_subscriptions.json');

class PushService {
  constructor() {
    this.subscriptions = this.loadSubscriptions();
    this.vapidKeys = this.initVapid();
  }

  initVapid() {
    let keys = null;

    // 1. Check environment variables
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      keys = {
        publicKey: process.env.VAPID_PUBLIC_KEY,
        privateKey: process.env.VAPID_PRIVATE_KEY
      };
    } else if (fs.existsSync(VAPID_FILE)) {
      // 2. Check local JSON file
      try {
        keys = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf8'));
      } catch (err) {
        console.error('Error leyendo vapid_keys.json:', err);
      }
    }

    // 3. Generate if not found and web-push is present
    if (!keys && webpush) {
      try {
        keys = webpush.generateVAPIDKeys();
        fs.writeFileSync(VAPID_FILE, JSON.stringify(keys, null, 2), 'utf8');
        console.log('🔑 Nuevas llaves VAPID generadas y guardadas en vapid_keys.json');
      } catch (err) {
        console.error('Error generando VAPID keys:', err);
      }
    }

    // Setup webpush details
    if (webpush && keys?.publicKey && keys?.privateKey) {
      try {
        webpush.setVapidDetails(
          'mailto:alejosierra656@gmail.com',
          keys.publicKey,
          keys.privateKey
        );
      } catch (err) {
        console.warn('Error configurando VAPID en webpush:', err.message);
      }
    }

    return keys;
  }

  loadSubscriptions() {
    try {
      if (fs.existsSync(SUBS_FILE)) {
        return JSON.parse(fs.readFileSync(SUBS_FILE, 'utf8'));
      }
    } catch (e) {
      console.error('Error cargando push_subscriptions.json:', e);
    }
    return [];
  }

  saveSubscriptions() {
    try {
      fs.writeFileSync(SUBS_FILE, JSON.stringify(this.subscriptions, null, 2), 'utf8');
    } catch (e) {
      console.error('Error guardando push_subscriptions.json:', e);
    }
  }

  getPublicKey() {
    return this.vapidKeys ? this.vapidKeys.publicKey : null;
  }

  addSubscription(subscription) {
    if (!subscription || !subscription.endpoint) {
      return { success: false, error: 'Suscripción inválida' };
    }

    const existingIdx = this.subscriptions.findIndex(s => s.endpoint === subscription.endpoint);
    if (existingIdx >= 0) {
      this.subscriptions[existingIdx] = {
        ...subscription,
        updatedAt: new Date().toISOString()
      };
    } else {
      this.subscriptions.push({
        ...subscription,
        createdAt: new Date().toISOString()
      });
    }

    this.saveSubscriptions();
    return { success: true, count: this.subscriptions.length };
  }

  removeSubscription(endpoint) {
    this.subscriptions = this.subscriptions.filter(s => s.endpoint !== endpoint);
    this.saveSubscriptions();
    return { success: true, count: this.subscriptions.length };
  }

  /**
   * Broadcast push notification to all stored device subscriptions
   */
  async sendPushNotification(payload) {
    if (!webpush || !this.vapidKeys) {
      return { success: false, error: 'WebPush no está configurado o inicializado' };
    }

    const stringPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const toRemove = [];

    const results = await Promise.allSettled(
      this.subscriptions.map(async (sub) => {
        try {
          return await webpush.sendNotification(sub, stringPayload);
        } catch (err) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Subscription expired or unregistered
            toRemove.push(sub.endpoint);
          }
          throw err;
        }
      })
    );

    if (toRemove.length > 0) {
      this.subscriptions = this.subscriptions.filter(s => !toRemove.includes(s.endpoint));
      this.saveSubscriptions();
    }

    const successful = results.filter(r => r.status === 'fulfilled').length;
    return {
      success: true,
      sentCount: successful,
      totalCount: this.subscriptions.length,
      removedDeadCount: toRemove.length
    };
  }
}

module.exports = new PushService();
