/**
 * API Gateway - PRIME OS Microservices Router
 * Exposes unified REST endpoints on port 5000 AND serves the React Frontend.
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const authService = require('./services/auth/service');
const scheduleService = require('./services/schedule/service');
const outlierService = require('./services/outlier/service');
const habitsService = require('./services/habits/service');
const financeService = require('./services/finance/service');
const notificationsService = require('./services/notifications/service');

const PORT = process.env.PORT || 5000;
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', err => reject(err));
  });
}

function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function serveStatic(req, res, pathname) {
  let filePath = path.join(CLIENT_DIST, pathname === '/' ? 'index.html' : pathname);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(CLIENT_DIST, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const isHtmlOrSw = filePath.endsWith('index.html') || filePath.endsWith('sw.js') || filePath.endsWith('manifest.webmanifest');
  const cacheControl = isHtmlOrSw ? 'no-cache, no-store, must-revalidate' : 'public, max-age=31536000, immutable';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': cacheControl
      });
      res.end(content);
    }
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  try {
    // 1. Auth Service Routes
    if (pathname === '/api/auth/profile' && req.method === 'GET') {
      const result = await authService.getProfile(query.email || 'alejosierra656@gmail.com');
      return sendResponse(res, 200, result);
    }
    if (pathname === '/api/auth/settings' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await authService.updateSettings(body);
      return sendResponse(res, 200, result);
    }

    // 2. Schedule Service Routes
    if (pathname === '/api/schedule/all' && req.method === 'GET') {
      const result = await scheduleService.getAllEvents();
      return sendResponse(res, 200, result);
    }
    if (pathname.startsWith('/api/schedule/day/') && req.method === 'GET') {
      const day = pathname.split('/').pop();
      const result = await scheduleService.getEventsByDay(day);
      return sendResponse(res, 200, result);
    }
    if (pathname === '/api/schedule/add' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await scheduleService.addEvent(body);
      return sendResponse(res, 200, result);
    }
    if (pathname.startsWith('/api/schedule/delete/') && req.method === 'DELETE') {
      const id = pathname.split('/').pop();
      const result = await scheduleService.deleteEvent(id);
      return sendResponse(res, 200, result);
    }
    if (pathname === '/api/schedule/export-ics' && req.method === 'GET') {
      const icsData = scheduleService.generateICS(query.day);
      res.writeHead(200, {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="prime_horario_alejo.ics"',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(icsData);
    }

    // 3. Outlier Service Routes
    if (pathname === '/api/outlier/stats' && req.method === 'GET') {
      const result = await outlierService.getStats();
      return sendResponse(res, 200, result);
    }
    if (pathname === '/api/outlier/log' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await outlierService.logSession(body);
      return sendResponse(res, 200, result);
    }
    if (pathname === '/api/outlier/rate' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await outlierService.updateRate(body.rate);
      return sendResponse(res, 200, result);
    }

    // 4. Habits & Duolingo Sleep Alarm Routes
    if ((pathname === '/api/habits/status' || pathname === '/api/habits/overview') && req.method === 'GET') {
      const result = await habitsService.getHabitsStatus();
      return sendResponse(res, 200, result);
    }
    if (pathname === '/api/habits/water/drink' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await habitsService.logWater(body.amountMl || 250);
      return sendResponse(res, 200, result);
    }
    if (pathname === '/api/habits/water/reset' && req.method === 'POST') {
      const result = await habitsService.resetWater();
      return sendResponse(res, 200, result);
    }
    if (pathname === '/api/habits/chore/toggle' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await habitsService.toggleChore(body.id);
      return sendResponse(res, 200, result);
    }
    if (pathname === '/api/habits/sleep/alarm' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await habitsService.triggerSleepAlarm(body.active !== false);
      return sendResponse(res, 200, result);
    }
    if (pathname === '/api/habits/sleep/confirm' && req.method === 'POST') {
      const result = await habitsService.confirmSleep();
      return sendResponse(res, 200, result);
    }

    // 5. Finance Service Routes
    if (pathname === '/api/finance/overview' && req.method === 'GET') {
      const result = await financeService.getFinanceOverview(query.rate || 15);
      return sendResponse(res, 200, result);
    }
    if (pathname === '/api/finance/evaluate' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await financeService.evaluateExpense(body);
      return sendResponse(res, 200, result);
    }
    if (pathname === '/api/finance/save' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await financeService.addSaving(body);
      return sendResponse(res, 200, result);
    }
    if (pathname === '/api/finance/update-goals' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await financeService.updateGoals(body);
      return sendResponse(res, 200, result);
    }
    if (pathname.startsWith('/api/finance/saving/') && req.method === 'DELETE') {
      const id = pathname.split('/').pop();
      const result = await financeService.deleteSaving(id);
      return sendResponse(res, 200, result);
    }

    // 6. Notifications & Reminders Service Routes
    if (pathname === '/api/notifications/stream' && req.method === 'GET') {
      return notificationsService.handleSSEStream(req, res);
    }
    if (pathname === '/api/notifications/pending' && req.method === 'GET') {
      const minutes = parseInt(query.minutes, 10) || 30;
      const reminders = notificationsService.getPendingReminders(minutes);
      return sendResponse(res, 200, { success: true, reminders });
    }
    if (pathname === '/api/notifications/confirm' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = notificationsService.confirmReminder(body.id, body.actionData);
      return sendResponse(res, 200, result);
    }
    if (pathname === '/api/notifications/snooze' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = notificationsService.snoozeReminder(body.id, body.minutes || 10, body.count || 0);
      return sendResponse(res, 200, result);
    }
    if (pathname === '/api/notifications/delivered' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = notificationsService.markDeliveredInApp(body.id);
      return sendResponse(res, 200, result);
    }
    if (pathname === '/api/notifications/history' && req.method === 'GET') {
      const days = parseInt(query.days, 10) || 7;
      const history = notificationsService.getHistory(days);
      return sendResponse(res, 200, { success: true, history });
    }
    if (pathname === '/api/notifications/clear' && req.method === 'POST') {
      const result = notificationsService.clearHistory();
      return sendResponse(res, 200, result);
    }
    if (pathname === '/api/notifications/trigger' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = notificationsService.sendReminder(body);
      return sendResponse(res, 200, { success: true, reminder: result });
    }

    // Static Frontend files
    if (!pathname.startsWith('/api/')) {
      return serveStatic(req, res, pathname);
    }

    // Fallback 404
    sendResponse(res, 404, { error: 'Ruta no encontrada en el Gateway de PRIME OS' });
  } catch (error) {
    console.error('Error en Gateway:', error);
    sendResponse(res, 500, { error: 'Error interno en Gateway', details: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 PRIME OS (React + Microservicios) activo en http://localhost:${PORT}`);
  console.log(`Usuario autenticado: alejosierra656@gmail.com`);
  console.log(`======================================================\n`);
});
