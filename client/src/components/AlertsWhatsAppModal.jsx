import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  MessageSquare,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Send,
  Smartphone,
  Save,
  ShieldCheck,
  Sparkles,
  X,
  Volume2
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function AlertsWhatsAppModal({
  isOpen,
  onClose,
  notifPermission,
  isPushSubscribed,
  onRequestPushPermission,
  onTestPushNotification,
  selectedDay = 0
}) {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState('whatsapp'); // 'whatsapp' | 'push' | 'gcal'

  // WhatsApp Config state
  const [waConfig, setWaConfig] = useState({
    enabled: true,
    provider: 'callmebot',
    phone: '573000000000',
    apiKey: '',
    notify15MinBefore: true,
    notifyAtStart: true,
    notifyBedtime: true
  });
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [sendingSummary, setSendingSummary] = useState(false);
  const [copiedFeed, setCopiedFeed] = useState(false);

  // Fetch current WhatsApp config
  useEffect(() => {
    if (isOpen) {
      setLoadingConfig(true);
      fetch('/api/notifications/whatsapp/config')
        .then(r => r.json())
        .then(data => {
          if (data.success && data.config) {
            setWaConfig(prev => ({
              ...prev,
              ...data.config,
              // Keep apiKey if returned or empty placeholder
              apiKey: data.config.apiKeyMasked || ''
            }));
          }
        })
        .catch(err => console.error('Error cargando config whatsapp:', err))
        .finally(() => setLoadingConfig(false));
    }
  }, [isOpen]);

  const handleSaveWhatsAppConfig = async (e) => {
    if (e) e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await fetch('/api/notifications/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(waConfig)
      });
      const data = await res.json();
      if (data.success) {
        toast.success({
          title: 'Configuración guardada',
          message: 'Tus preferencias de WhatsApp para PRIME OS han sido actualizadas.'
        });
      } else {
        toast.error({
          title: 'Error al guardar',
          message: data.error || 'No se pudo guardar la configuración.'
        });
      }
    } catch (err) {
      toast.error({ title: 'Error de red', message: err.message });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTestWhatsApp = async () => {
    setTestingWhatsApp(true);
    try {
      const res = await fetch('/api/notifications/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: waConfig.phone,
          apiKey: waConfig.apiKey.includes('****') ? undefined : waConfig.apiKey,
          text: '⚡ *PRIME OS*: ¡Hola Alejo! Tu bot de WhatsApp está conectado y listo para enviarte alertas de tus clases, arbitraje COARC, tesis y alarma de las 10 PM. 🔥'
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success({
          title: '¡WhatsApp enviado con éxito!',
          message: 'Revisa tu chat de WhatsApp en el celular.'
        });
      } else if (data.notConfigured) {
        toast.warning({
          title: 'Falta configurar CallMeBot',
          message: data.message || 'Ingresa tu API Key de CallMeBot primero.'
        });
      } else {
        toast.error({
          title: 'Error enviando WhatsApp',
          message: data.error || data.message || 'Verifica el número o la API Key.'
        });
      }
    } catch (err) {
      toast.error({ title: 'Error de conexión', message: err.message });
    } finally {
      setTestingWhatsApp(false);
    }
  };

  const handleSendTodaySummary = async () => {
    setSendingSummary(true);
    try {
      const res = await fetch('/api/notifications/whatsapp/send-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: selectedDay })
      });
      const data = await res.json();
      if (data.success) {
        toast.success({
          title: 'Agenda enviada a WhatsApp',
          message: 'Revisa tu WhatsApp, tienes el desglose de tus compromisos de hoy.'
        });
      } else {
        toast.warning({
          title: 'No se pudo enviar',
          message: data.message || 'Revisa tu configuración de WhatsApp.'
        });
      }
    } catch (err) {
      toast.error({ title: 'Error', message: err.message });
    } finally {
      setSendingSummary(false);
    }
  };

  const feedUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/schedule/feed.ics`
    : '/api/schedule/feed.ics';

  const handleCopyFeedUrl = () => {
    navigator.clipboard.writeText(feedUrl);
    setCopiedFeed(true);
    toast.success({
      title: 'Enlace del Feed copiado',
      message: 'Pégalo en Google Calendar → Otros calendarios → "Desde una URL".'
    });
    setTimeout(() => setCopiedFeed(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface border border-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-text flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-surface-2/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-accent-subtle border border-accent/30 flex items-center justify-center text-accent shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-text flex items-center gap-2">
                Centro de Alertas & Notificaciones
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30">
                  PRO
                </span>
              </h2>
              <p className="text-xs text-text-muted">
                WhatsApp, Notificaciones Push y Sincronización con Google Calendar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-surface-2 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border bg-surface-2/20 px-4 gap-2 pt-2">
          <button
            onClick={() => setActiveSubTab('whatsapp')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeSubTab === 'whatsapp'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp Bot
          </button>
          <button
            onClick={() => setActiveSubTab('push')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeSubTab === 'push'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Notificaciones Push (Móvil)
          </button>
          <button
            onClick={() => setActiveSubTab('gcal')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeSubTab === 'gcal'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Google Calendar (Sync)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* TAB 1: WHATSAPP BOT */}
          {activeSubTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-emerald-300">
                    Recordatorios automáticos en tu WhatsApp
                  </p>
                  <p className="text-emerald-200/80">
                    PRIME OS te enviará avisos 15 min antes de tus clases, arbitraje COARC, tesis, turnos de Outlier y la alarma de sueño de las 10 PM.
                  </p>
                </div>
              </div>

              {/* Step by step for CallMeBot */}
              <div className="p-3.5 rounded-xl bg-surface-2 border border-border text-xs space-y-2">
                <span className="font-bold text-text flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Activación gratuita en 30 segundos (CallMeBot)
                </span>
                <ol className="text-text-muted text-[11px] space-y-1.5 list-decimal list-inside">
                  <li>
                    Añade a tus contactos de WhatsApp el número: <strong className="text-text">+34 644 44 87 34</strong> o dale clic al botón abajo.
                  </li>
                  <li>
                    Envíale el mensaje: <code className="bg-surface px-1.5 py-0.5 rounded text-accent font-mono">I allow callmebot to send me messages</code>
                  </li>
                  <li>
                    El bot te responderá con tu <strong className="text-text">API Key personal</strong>. Cópialo y pégalo en la casilla de abajo.
                  </li>
                </ol>
                <a
                  href="https://api.whatsapp.com/send?phone=34644448734&text=I%20allow%20callmebot%20to%20send%20me%20messages"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors mt-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Abrir chat de WhatsApp para pedir API Key
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Form Settings */}
              <form onSubmit={handleSaveWhatsAppConfig} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-text block mb-1">
                    Tu número de WhatsApp (con código de país, ej. 57 para Colombia):
                  </label>
                  <input
                    type="text"
                    value={waConfig.phone}
                    onChange={(e) => setWaConfig({ ...waConfig, phone: e.target.value })}
                    placeholder="573001234567"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border text-text font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-text block mb-1">
                    API Key de CallMeBot:
                  </label>
                  <input
                    type="password"
                    value={waConfig.apiKey}
                    onChange={(e) => setWaConfig({ ...waConfig, apiKey: e.target.value })}
                    placeholder="Pega aquí la clave que te dio el bot"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border text-text font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>

                {/* Toggles */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <label className="flex items-center gap-2.5 text-xs text-text cursor-pointer">
                    <input
                      type="checkbox"
                      checked={waConfig.notify15MinBefore}
                      onChange={(e) => setWaConfig({ ...waConfig, notify15MinBefore: e.target.checked })}
                      className="rounded border-border text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>Avisarme por WhatsApp <strong>15 minutos antes</strong> de cada compromiso del calendario</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-text cursor-pointer">
                    <input
                      type="checkbox"
                      checked={waConfig.notifyAtStart}
                      onChange={(e) => setWaConfig({ ...waConfig, notifyAtStart: e.target.checked })}
                      className="rounded border-border text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>Avisarme al minuto exacto en que <strong>comienza</strong> la actividad</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-text cursor-pointer">
                    <input
                      type="checkbox"
                      checked={waConfig.notifyBedtime}
                      onChange={(e) => setWaConfig({ ...waConfig, notifyBedtime: e.target.checked })}
                      className="rounded border-border text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>Avisarme a las <strong>10:00 PM</strong> con la alarma de sueño estilo Duolingo</span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3">
                  <button
                    type="submit"
                    disabled={savingConfig}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingConfig ? 'Guardando...' : 'Guardar Ajustes'}
                  </button>

                  <button
                    type="button"
                    onClick={handleTestWhatsApp}
                    disabled={testingWhatsApp}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-surface-2 hover:bg-surface border border-border text-text font-bold text-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    {testingWhatsApp ? 'Enviando...' : 'Probar WhatsApp'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendTodaySummary}
                    disabled={sendingSummary}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-surface-2 hover:bg-surface border border-border text-text font-bold text-xs transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5 text-accent" />
                    {sendingSummary ? 'Enviando...' : 'Enviar Agenda Hoy'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: NOTIFICACIONES PUSH */}
          {activeSubTab === 'push' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-accent-subtle/50 border border-accent/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text">Estado del Navegador:</span>
                  <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-full ${
                    notifPermission === 'granted'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {notifPermission === 'granted' ? 'Permitido' : 'Pendiente'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text">Suscripción Web Push VAPID:</span>
                  <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-full ${
                    isPushSubscribed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  }`}>
                    {isPushSubscribed ? 'Activo en segundo plano' : 'Listo para registrar'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-text-muted">
                <p>
                  Las <strong>Notificaciones Push</strong> de PRIME OS funcionan tanto en tu computadora como en tu teléfono (Android y iPhone con PWA añadida a pantalla de inicio).
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Te avisan 15 minutos antes de cada evento del calendario.</li>
                  <li>Activan la vibración táctil en el teléfono para no perder ningún compromiso.</li>
                  <li>Sonarán a las 10:00 PM con la alarma de sueño.</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={onRequestPushPermission}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-black text-xs transition-colors shadow-xs"
                >
                  <Bell className="w-4 h-4" />
                  Activar Notificaciones Push
                </button>

                <button
                  type="button"
                  onClick={onTestPushNotification}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-surface-2 hover:bg-surface border border-border text-text font-bold text-xs transition-colors"
                >
                  <Volume2 className="w-4 h-4 text-accent" />
                  Probar Alerta Push con Vibración
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: GOOGLE CALENDAR (SYNC) */}
          {activeSubTab === 'gcal' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/30 space-y-2">
                <p className="text-xs font-bold text-sky-300">
                  Suscripción en Vivo (Recomendada)
                </p>
                <p className="text-xs text-sky-200/80">
                  Agrega este enlace a tu Google Calendar una sola vez. Cada vez que agregues o edites un compromiso en PRIME OS, tu Google Calendar se actualizará solo.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text block">
                  URL del Feed iCal de PRIME OS:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={feedUrl}
                    className="flex-1 px-3 py-2 rounded-xl bg-surface-2 border border-border text-text font-mono text-xs focus-visible:outline-none"
                  />
                  <button
                    onClick={handleCopyFeedUrl}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 text-xs font-bold transition-colors shrink-0 shadow-xs"
                  >
                    {copiedFeed ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedFeed ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-2 border border-border text-xs space-y-2">
                <span className="font-bold text-text flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-accent" /> Pasos para sincronizarlo con Google Calendar:
                </span>
                <ol className="text-text-muted text-[11px] space-y-1 list-decimal list-inside">
                  <li>Abre <strong>calendar.google.com</strong> en tu navegador.</li>
                  <li>En el panel izquierdo, busca <strong>"Otros calendarios"</strong> y dale clic al signo <strong>+</strong>.</li>
                  <li>Selecciona <strong>"Desde una URL"</strong>.</li>
                  <li>Pega el enlace de arriba y dale clic a <strong>"Añadir calendario"</strong>. ¡Listo!</li>
                </ol>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <a
                  href="/api/schedule/export-ics"
                  download="prime_horario_alejo.ics"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-2 hover:bg-surface border border-border text-text text-xs font-bold transition-colors"
                >
                  <Calendar className="w-4 h-4 text-accent" />
                  Descargar archivo .ics sin conexión
                </a>

                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600/30 hover:bg-sky-600/50 border border-sky-500/40 text-sky-200 text-xs font-bold transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir Google Calendar Web
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-border bg-surface-2/20">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-surface-2 hover:bg-surface text-text text-xs font-bold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
