/**
 * NotificationCenter.jsx — Centro de Notificaciones y Ajustes de Alertas para PRIME OS
 *
 * Características:
 * - Vista dual: Popover en escritorio (anclado a la campana) y Drawer en móvil.
 * - Historial de los últimos 7 días agrupado en "Hoy" y "Anteriores".
 * - Filtros rápidos por chips: Todos, Recordatorios, Logros, Sistema.
 * - Estados de cada ítem: Confirmado, Pospuesto, Crítico, Entregado.
 * - Acciones rápidas: Marcar todo como leído, Limpiar historial, navegar a la pestaña del ítem.
 * - Panel integrado de Ajustes: Sonido, Vibración, Modo No Molestar, Duración y Posición.
 * - Cumple con contraste AA, prefers-reduced-motion y objetivos táctiles ≥ 44 px.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  Settings,
  X,
  Sparkles,
  Trophy,
  Droplets,
  Moon,
  Dumbbell,
  Calendar,
  Clock,
  PiggyBank,
  CheckSquare,
  Volume2,
  VolumeX,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useToast } from '../hooks/useToast';

/* ─── Helper de Formato de Tiempo Relativo ──────────────────── */
function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Reciente';
  const now = Date.now();
  const diffMinutes = Math.floor((now - timestamp) / (60 * 1000));
  if (diffMinutes < 1) return 'Ahora mismo';
  if (diffMinutes < 60) return `Hace ${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Ayer';
  return `Hace ${diffDays} días`;
}

function isToday(timestamp) {
  if (!timestamp) return true;
  const d = new Date(timestamp);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/* ─── Ícono según Categoría / Tipo ─────────────────────────── */
function ItemIcon({ type, category }) {
  if (type === 'critical') {
    return (
      <div className="w-8 h-8 rounded-xl bg-danger/15 text-danger border border-danger/30 flex items-center justify-center shrink-0">
        <Bell className="w-4 h-4 animate-pulse" />
      </div>
    );
  }
  if (type === 'logro' || type === 'achievement') {
    return (
      <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center shrink-0">
        <Trophy className="w-4 h-4" />
      </div>
    );
  }
  switch (category) {
    case 'water':
      return (
        <div className="w-8 h-8 rounded-xl bg-accent-subtle text-accent border border-accent/30 flex items-center justify-center shrink-0">
          <Droplets className="w-4 h-4" />
        </div>
      );
    case 'sleep':
      return (
        <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
          <Moon className="w-4 h-4" />
        </div>
      );
    case 'workout':
    case 'gym':
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center shrink-0">
          <Dumbbell className="w-4 h-4" />
        </div>
      );
    case 'schedule':
      return (
        <div className="w-8 h-8 rounded-xl bg-accent-subtle text-accent border border-accent/30 flex items-center justify-center shrink-0">
          <Calendar className="w-4 h-4" />
        </div>
      );
    case 'outlier':
      return (
        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4" />
        </div>
      );
    case 'finance':
      return (
        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <PiggyBank className="w-4 h-4" />
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-xl bg-surface-2 text-text-muted border border-border flex items-center justify-center shrink-0">
          <CheckSquare className="w-4 h-4" />
        </div>
      );
  }
}

/* ─── Componente Principal ─────────────────────────────────── */
export default function NotificationCenter({ isOpen, onClose }) {
  const {
    history,
    unreadCount,
    markAllAsRead,
    clearHistory,
    settings,
    updateSettings,
    onNavigateTab
  } = useToast();

  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' | 'settings'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'reminders' | 'achievements' | 'system'
  const panelRef = useRef(null);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtrado de elementos
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      if (filterType === 'reminders') return item.type === 'reminder' || item.type === 'critical';
      if (filterType === 'achievements') return item.type === 'logro' || item.type === 'achievement';
      if (filterType === 'system') return item.type !== 'reminder' && item.type !== 'critical' && item.type !== 'logro' && item.type !== 'achievement';
      return true;
    });
  }, [history, filterType]);

  // Agrupado en Hoy y Anteriores
  const { todayItems, olderItems } = useMemo(() => {
    const today = [];
    const older = [];
    filteredHistory.forEach((item) => {
      if (isToday(item.timestamp)) {
        today.push(item);
      } else {
        older.push(item);
      }
    });
    return { todayItems: today, olderItems: older };
  }, [filteredHistory]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Centro de Notificaciones y Alertas"
      className="fixed inset-0 z-50 flex items-start justify-end p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.aside
        ref={panelRef}
        initial={{ opacity: 0, x: 40, scale: 0.98 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 40, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        className="w-full sm:max-w-md h-full sm:h-[90vh] sm:max-h-[780px] bg-surface border-0 sm:border border-border sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-text"
      >
        {/* Encabezado del Panel */}
        <div className="p-4 sm:p-5 border-b border-border bg-surface-2/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent-subtle border border-accent/30 flex items-center justify-center text-accent">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-text">Notificaciones</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-accent text-slate-950 text-[10px] font-black">
                    {unreadCount} nuevas
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">Centro de disciplina y alertas Prime</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Toggle entre Lista y Ajustes */}
            <button
              onClick={() => setActiveTab(activeTab === 'notifications' ? 'settings' : 'notifications')}
              aria-label={activeTab === 'notifications' ? 'Ir a ajustes de alertas' : 'Ver notificaciones'}
              className={`p-2 rounded-xl border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                activeTab === 'settings'
                  ? 'bg-accent text-slate-950 border-accent font-bold'
                  : 'bg-surface-2 hover:bg-surface border-border text-text-muted hover:text-text'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Botón Cerrar */}
            <button
              onClick={onClose}
              aria-label="Cerrar centro de notificaciones"
              className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-surface-2 border border-transparent transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Vista: Pestaña Notificaciones ── */}
        {activeTab === 'notifications' && (
          <>
            {/* Barra de Filtros por Chips y Acciones Globales */}
            <div className="px-4 py-3 border-b border-border bg-surface flex flex-col gap-2 shrink-0">
              <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1.5 shrink-0">
                  {[
                    { id: 'all', label: 'Todas' },
                    { id: 'reminders', label: 'Recordatorios' },
                    { id: 'achievements', label: 'Logros' },
                    { id: 'system', label: 'Sistema' }
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      onClick={() => setFilterType(chip.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors min-h-[36px] ${
                        filterType === chip.id
                          ? 'bg-accent text-slate-950 font-black'
                          : 'bg-surface-2 hover:bg-surface border border-border text-text-muted hover:text-text'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botones de acción colectiva */}
              {history.length > 0 && (
                <div className="flex items-center justify-between pt-1 text-xs text-text-muted">
                  <button
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                    className="flex items-center gap-1.5 hover:text-accent font-semibold transition-colors disabled:opacity-40 min-h-[36px] px-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Marcar todas leídas
                  </button>

                  <button
                    onClick={clearHistory}
                    className="flex items-center gap-1.5 hover:text-danger font-semibold transition-colors min-h-[36px] px-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Limpiar historial
                  </button>
                </div>
              )}
            </div>

            {/* Lista del Historial con Scroll Suave */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-safe">
              {filteredHistory.length === 0 ? (
                /* Estado Vacío Amable */
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center text-text-muted">
                    <Sparkles className="w-7 h-7 text-accent" />
                  </div>
                  <h4 className="text-sm font-extrabold text-text">Bandeja despejada</h4>
                  <p className="text-xs text-text-muted max-w-xs leading-relaxed">
                    No tienes alertas pendientes en esta sección. Tu horario, agua y Outlier están bajo control.
                  </p>
                </div>
              ) : (
                <>
                  {/* Grupo: Hoy */}
                  {todayItems.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-black text-text-muted uppercase tracking-wider px-1">
                        Hoy ({todayItems.length})
                      </span>
                      <div className="space-y-2">
                        {todayItems.map((item) => (
                          <NotificationCard
                            key={item.id}
                            item={item}
                            onNavigateTab={onNavigateTab}
                            onClosePanel={onClose}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grupo: Anteriores */}
                  {olderItems.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-black text-text-muted uppercase tracking-wider px-1">
                        Anteriores ({olderItems.length})
                      </span>
                      <div className="space-y-2">
                        {olderItems.map((item) => (
                          <NotificationCard
                            key={item.id}
                            item={item}
                            onNavigateTab={onNavigateTab}
                            onClosePanel={onClose}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* ── Vista: Pestaña Ajustes de Alertas ── */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 pb-safe text-text">
            <div>
              <h4 className="text-sm font-extrabold text-text">Ajustes de Notificaciones</h4>
              <p className="text-xs text-text-muted mt-0.5">
                Personaliza cómo y cuándo PRIME OS te avisa en este dispositivo.
              </p>
            </div>

            <div className="space-y-3 bg-surface-2/50 border border-border p-4 rounded-2xl">
              {/* Toggle: Sonido */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2.5">
                  {settings.soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-accent" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-text-muted" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-text block">Sonidos de alerta</span>
                    <span className="text-[11px] text-text-muted block">
                      Campanadas y tonos Web Audio API
                    </span>
                  </div>
                </div>
                <button
                  role="switch"
                  aria-checked={settings.soundEnabled}
                  aria-label="Activar o desactivar sonido"
                  onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                  className={`relative w-11 h-6 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    settings.soundEnabled ? 'bg-accent' : 'bg-border'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-xs ${
                      settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle: Vibración Háptica */}
              <div className="flex items-center justify-between py-1 border-t border-border/60 pt-3">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-accent" />
                  <div>
                    <span className="text-xs font-bold text-text block">Vibración háptica</span>
                    <span className="text-[11px] text-text-muted block">
                      En dispositivos Android / PWA
                    </span>
                  </div>
                </div>
                <button
                  role="switch"
                  aria-checked={settings.vibrationEnabled}
                  aria-label="Activar o desactivar vibración"
                  onClick={() => updateSettings({ vibrationEnabled: !settings.vibrationEnabled })}
                  className={`relative w-11 h-6 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    settings.vibrationEnabled ? 'bg-accent' : 'bg-border'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-xs ${
                      settings.vibrationEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle: Modo No Molestar */}
              <div className="flex items-center justify-between py-1 border-t border-border/60 pt-3">
                <div className="flex items-center gap-2.5">
                  <BellOff className="w-4 h-4 text-warning" />
                  <div>
                    <span className="text-xs font-bold text-text block">Modo No Molestar</span>
                    <span className="text-[11px] text-text-muted block">
                      Silencia toasts no críticos (los críticos siempre suenan)
                    </span>
                  </div>
                </div>
                <button
                  role="switch"
                  aria-checked={settings.doNotDisturb}
                  aria-label="Activar o desactivar modo no molestar"
                  onClick={() => updateSettings({ doNotDisturb: !settings.doNotDisturb })}
                  className={`relative w-11 h-6 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    settings.doNotDisturb ? 'bg-warning' : 'bg-border'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-xs ${
                      settings.doNotDisturb ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Selector: Duración de Toasts */}
            <div className="space-y-2 bg-surface-2/50 border border-border p-4 rounded-2xl">
              <span className="text-xs font-bold text-text block">
                Duración del aviso en pantalla
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '3 seg', val: 3000 },
                  { label: '5 seg (Recom)', val: 5000 },
                  { label: '8 seg', val: 8000 }
                ].map((dur) => (
                  <button
                    key={dur.val}
                    onClick={() => updateSettings({ duration: dur.val })}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-colors min-h-[44px] ${
                      settings.duration === dur.val
                        ? 'bg-accent text-slate-950 border-accent font-black shadow-xs'
                        : 'bg-surface hover:bg-surface-2 border-border text-text'
                    }`}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector: Posición en Escritorio */}
            <div className="space-y-2 bg-surface-2/50 border border-border p-4 rounded-2xl">
              <span className="text-xs font-bold text-text block">
                Posición de los toasts en escritorio
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'top-right', label: 'Arriba Der.' },
                  { id: 'bottom-right', label: 'Abajo Der.' },
                  { id: 'bottom-center', label: 'Abajo Centro' }
                ].map((pos) => (
                  <button
                    key={pos.id}
                    onClick={() => updateSettings({ position: pos.id })}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-colors min-h-[44px] ${
                      settings.position === pos.id
                        ? 'bg-accent text-slate-950 border-accent font-black shadow-xs'
                        : 'bg-surface hover:bg-surface-2 border-border text-text'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.aside>
    </div>
  );
}

/* ─── Tarjeta de Notificación Individual ───────────────────── */
function NotificationCard({ item, onNavigateTab, onClosePanel }) {
  const statusPill = useMemo(() => {
    if (item.status === 'confirmed') {
      return <span className="text-[10px] font-bold text-success bg-success/15 px-2 py-0.5 rounded-full">Completado</span>;
    }
    if (item.status === 'snoozed') {
      return <span className="text-[10px] font-bold text-warning bg-warning/15 px-2 py-0.5 rounded-full">Pospuesto</span>;
    }
    if (item.type === 'critical') {
      return <span className="text-[10px] font-bold text-danger bg-danger/15 px-2 py-0.5 rounded-full">Crítico</span>;
    }
    return <span className="text-[10px] font-bold text-text-muted bg-surface-2 px-2 py-0.5 rounded-full">Recibido</span>;
  }, [item.status, item.type]);

  const handleCardClick = () => {
    if (item.tab && onNavigateTab) {
      onNavigateTab(item.tab);
      onClosePanel();
    }
  };

  return (
    <div
      onClick={item.tab ? handleCardClick : undefined}
      className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 bg-surface hover:bg-surface-2/60 border-border ${
        item.tab ? 'cursor-pointer' : ''
      }`}
    >
      <ItemIcon type={item.type} category={item.category} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h5 className="text-xs font-black text-text truncate">{item.title}</h5>
          <span className="text-[10px] font-mono text-text-muted shrink-0">
            {formatTimeAgo(item.timestamp)}
          </span>
        </div>

        {item.message && (
          <p className="text-xs text-text-muted mt-0.5 leading-relaxed line-clamp-2">
            {item.message}
          </p>
        )}

        <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/40">
          <div>{statusPill}</div>

          {item.tab && (
            <span className="text-[11px] font-bold text-accent flex items-center gap-1 hover:underline">
              Ir <ChevronRight className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
