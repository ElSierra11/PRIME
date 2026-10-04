import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Monitor,
  Smartphone,
  MonitorCheck,
  Bell,
  BellOff,
  BellRing,
  MessageSquare,
  Download
} from 'lucide-react';
import { haptics } from '../utils/haptics';
import { wakeLockPrefs } from '../hooks/useWakeLock';

/** Interruptor accesible con objetivo táctil de 44 px (toda la fila es pulsable). */
function SwitchRow({ icon: Icon, label, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="w-full flex items-center justify-between gap-3 px-3 min-h-[44px] rounded-xl hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span className="flex items-center gap-2 text-xs font-semibold text-text min-w-0">
        <Icon className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </span>
      <span
        aria-hidden="true"
        className={`relative w-10 h-6 rounded-full transition-colors shrink-0 border ${
          checked ? 'bg-accent border-accent' : 'bg-surface-2 border-border'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full shadow transition-transform ${
            checked ? 'translate-x-4 bg-white' : 'translate-x-0 bg-text-muted'
          }`}
        />
      </span>
    </button>
  );
}

/**
 * Ajustes de la app: tema, vibración, pantalla activa, alertas, instalación y prueba de alarma.
 * `onAction` se llama antes de abrir otra vista (p. ej. para cerrar el menú contenedor).
 */
export default function SettingsPanel({
  theme,
  setTheme,
  notifPermission = 'default',
  notifSupported = false,
  onRequestNotifPermission = () => {},
  onTestNotification = () => {},
  onOpenAlertsModal = () => {},
  canInstall = false,
  onInstallApp = () => {},
  onTriggerAlarm = () => {},
  onAction = () => {},
  itemRole
}) {
  const [hapticsOn, setHapticsOn] = useState(() => haptics.isEnabled());
  const [wakeLockOn, setWakeLockOn] = useState(() => wakeLockPrefs.isEnabled());

  const toggleHaptics = () => {
    const next = !hapticsOn;
    haptics.setEnabled(next);
    setHapticsOn(next);
    if (next) haptics.seriesDone();
  };

  const toggleWakeLock = () => {
    const next = !wakeLockOn;
    wakeLockPrefs.setEnabled(next);
    setWakeLockOn(next);
  };

  const run = (fn) => () => {
    onAction();
    fn();
  };

  return (
    <div className="space-y-3 text-text">
      {/* Tema */}
      <div>
        <span id="settings-theme-label" className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2 px-1">
          Tema de la aplicación
        </span>
        <div
          role="radiogroup"
          aria-labelledby="settings-theme-label"
          className="grid grid-cols-3 gap-1.5 bg-surface-2 p-1 rounded-xl border border-border"
        >
          {[
            { id: 'light', label: 'Claro', icon: Sun },
            { id: 'dark', label: 'Oscuro', icon: Moon },
            { id: 'system', label: 'Auto', icon: Monitor }
          ].map((t) => {
            const TIcon = t.icon;
            const isSel = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={isSel}
                onClick={() => setTheme(t.id)}
                className={`flex items-center justify-center gap-1.5 min-h-[44px] px-2 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isSel ? 'bg-surface text-accent shadow-xs border border-border' : 'text-text-muted hover:text-text border border-transparent'
                }`}
              >
                <TIcon className="w-4 h-4" aria-hidden="true" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ajustes del sistema */}
      <div className="pt-2 border-t border-border space-y-1">
        <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block px-1 mb-1">
          Ajustes del sistema
        </span>

        {haptics.isSupported() && (
          <SwitchRow icon={Smartphone} label="Vibración háptica" checked={hapticsOn} onChange={toggleHaptics} />
        )}

        {typeof navigator !== 'undefined' && 'wakeLock' in navigator && (
          <SwitchRow icon={MonitorCheck} label="Pantalla activa (timers)" checked={wakeLockOn} onChange={toggleWakeLock} />
        )}

        {notifSupported && (
          <div className="px-3 py-2 rounded-xl bg-surface-2/40 border border-border/60">
            <div className="flex items-center justify-between gap-2 min-h-[36px]">
              <span className="flex items-center gap-2 text-xs font-semibold text-text min-w-0">
                {notifPermission === 'granted' ? (
                  <Bell className="w-4 h-4 text-success shrink-0" aria-hidden="true" />
                ) : notifPermission === 'denied' ? (
                  <BellOff className="w-4 h-4 text-danger shrink-0" aria-hidden="true" />
                ) : (
                  <Bell className="w-4 h-4 text-text-muted shrink-0" aria-hidden="true" />
                )}
                <span className="truncate">Notificaciones del navegador</span>
              </span>
              {notifPermission === 'granted' ? (
                <span className="text-[11px] font-black text-success shrink-0">Activo</span>
              ) : notifPermission === 'denied' ? (
                <span className="text-[11px] font-black text-danger shrink-0">Bloqueado</span>
              ) : (
                <button
                  type="button"
                  onClick={run(onRequestNotifPermission)}
                  className="px-3 min-h-[36px] rounded-lg bg-accent text-slate-950 text-[11px] font-black hover:bg-accent-hover transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Activar
                </button>
              )}
            </div>
            {notifPermission === 'granted' && (
              <button
                type="button"
                role={itemRole}
                onClick={run(onTestNotification)}
                className="w-full mt-2 flex items-center justify-between px-3 min-h-[44px] rounded-lg text-xs font-bold text-accent bg-accent-subtle/50 hover:bg-accent-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span className="flex items-center gap-1.5">
                  <BellRing className="w-4 h-4" aria-hidden="true" /> Enviar notificación de prueba
                </span>
              </button>
            )}
          </div>
        )}

        {/* Chat / Telegram / WhatsApp & Push */}
        <button
          type="button"
          role={itemRole}
          onClick={run(onOpenAlertsModal)}
          className="w-full flex items-center justify-between gap-2 px-3 min-h-[44px] rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <span className="flex items-center gap-2 min-w-0">
            <MessageSquare className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="truncate">Alertas por chat (Telegram / WhatsApp) y Push</span>
          </span>
        </button>
      </div>

      {canInstall && (
        <div className="pt-2 border-t border-border">
          <button
            type="button"
            role={itemRole}
            onClick={run(onInstallApp)}
            className="w-full flex items-center justify-between px-3 min-h-[44px] rounded-xl text-xs font-bold text-accent bg-accent-subtle/50 hover:bg-accent-subtle border border-accent/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="flex items-center gap-2">
              <Download className="w-4 h-4" aria-hidden="true" />
              Instalar PRIME OS
            </span>
            <span className="text-[10px] font-mono">PWA</span>
          </button>
        </div>
      )}

      <div className="pt-2 border-t border-border">
        <button
          type="button"
          role={itemRole}
          onClick={run(onTriggerAlarm)}
          className="w-full flex items-center justify-between px-3 min-h-[44px] rounded-xl text-xs font-bold text-warning bg-warning-subtle/50 hover:bg-warning-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning"
        >
          <span className="flex items-center gap-2">
            <BellRing className="w-4 h-4" aria-hidden="true" /> Alarma de dormir
          </span>
          <span className="text-[11px] text-text-muted font-normal">Probar</span>
        </button>
      </div>
    </div>
  );
}
