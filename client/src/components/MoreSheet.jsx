import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Shield, PiggyBank, Bell, Settings, X, ChevronLeft, ChevronRight } from 'lucide-react';
import SettingsPanel from './SettingsPanel';

/**
 * Hoja inferior "Más" (solo móvil, < md).
 * Accesos: Árbitro y Reglas, Ahorro, Notificaciones y Ajustes (tema, chat/Telegram, etc.).
 */
export default function MoreSheet({
  isOpen,
  onClose,
  activeTab,
  onNavigate,
  onOpenNotifications,
  unreadCount = 0,
  settingsProps,
  returnFocusRef
}) {
  const [view, setView] = useState('menu'); // 'menu' | 'settings'
  const sheetRef = useRef(null);
  const reduceMotion = useReducedMotion();

  // Reinicia la vista al abrir y gestiona foco / Escape
  useEffect(() => {
    if (!isOpen) return undefined;
    setView('menu');
    const t = setTimeout(() => {
      sheetRef.current?.querySelector('button, [href], [tabindex]:not([tabindex="-1"])')?.focus();
    }, 50);
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      // Trampa de foco simple
      if (e.key === 'Tab' && sheetRef.current) {
        const f = sheetRef.current.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    // Bloquea el scroll del fondo
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      returnFocusRef?.current?.focus?.();
    };
  }, [isOpen, onClose, returnFocusRef]);

  const items = [
    { id: 'referee', label: 'Árbitro y Reglas', desc: 'Partidos, Leyes del Juego y estudio', icon: Shield, onClick: () => onNavigate('referee') },
    { id: 'finance', label: 'Ahorro', desc: 'Metas, victorias y evaluador de gastos', icon: PiggyBank, onClick: () => onNavigate('finance') },
    {
      id: 'notifications',
      label: 'Notificaciones',
      desc: unreadCount > 0 ? `${unreadCount} sin leer` : 'Historial y avisos',
      icon: Bell,
      badge: unreadCount,
      onClick: onOpenNotifications
    },
    { id: 'settings', label: 'Ajustes', desc: 'Tema, chat / Telegram, vibración, instalar', icon: Settings, onClick: () => setView('settings') }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="presentation">
          <motion.div
            key="more-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            key="more-sheet"
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="more-sheet-title"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 40 }}
            drag={reduceMotion ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 600) onClose();
            }}
            className="absolute inset-x-0 bottom-0 max-h-[85dvh] flex flex-col bg-surface border-t border-border rounded-t-3xl shadow-2xl safe-px pb-[calc(12px+env(safe-area-inset-bottom))]"
          >
            {/* Asa de arrastre */}
            <div className="flex justify-center pt-2.5 pb-1 shrink-0" aria-hidden="true">
              <div className="w-10 h-1.5 rounded-full bg-border" />
            </div>

            <div className="flex items-center justify-between gap-2 py-2 shrink-0">
              {view === 'settings' ? (
                <button
                  type="button"
                  onClick={() => setView('menu')}
                  className="flex items-center gap-1 min-h-[44px] pr-3 -ml-1 rounded-xl text-sm font-bold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                  <span id="more-sheet-title">Ajustes</span>
                </button>
              ) : (
                <h2 id="more-sheet-title" className="text-base font-extrabold text-text px-1">Más</h2>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar menú Más"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-text-muted hover:text-text hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain -mx-1 px-1 pb-1">
              {view === 'menu' ? (
                <ul className="grid grid-cols-1 gap-2">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={item.onClick}
                          aria-current={isActive ? 'page' : undefined}
                          className={`w-full flex items-center gap-3 p-3 min-h-[60px] rounded-2xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                            isActive ? 'bg-accent-subtle border-accent/40' : 'bg-surface-2 border-border hover:border-accent/40'
                          }`}
                        >
                          <span className="relative w-10 h-10 rounded-xl bg-surface border border-border text-accent flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5" aria-hidden="true" />
                            {item.badge > 0 && (
                              <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-accent text-slate-950 text-[10px] font-mono font-black flex items-center justify-center">
                                {item.badge > 9 ? '9+' : item.badge}
                              </span>
                            )}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className={`block text-sm font-bold truncate ${isActive ? 'text-accent' : 'text-text'}`}>{item.label}</span>
                            <span className="block text-xs text-text-muted truncate">{item.desc}</span>
                          </span>
                          <ChevronRight className="w-4 h-4 text-text-muted shrink-0" aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <SettingsPanel {...settingsProps} onAction={onClose} />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
