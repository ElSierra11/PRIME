import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarCheck2,
  Clock,
  Dumbbell,
  PiggyBank,
  BellRing,
  Bell,
  BellOff,
  UserCheck,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  Smartphone,
  MonitorCheck,
  Download,
  MessageSquare
} from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';
import { haptics } from '../utils/haptics';
import { wakeLockPrefs } from '../hooks/useWakeLock';
import { useToast } from '../hooks/useToast';
import NotificationCenter from './NotificationCenter';
import PrimeLogo from './PrimeLogo';

export default function Navbar({
  activeTab,
  setActiveTab,
  primeScore,
  onTriggerAlarm,
  theme,
  setTheme,
  // Función opcional para precargar el chunk de una pestaña en hover/foco
  onPreloadTab = () => {},
  // Notificaciones del navegador y WhatsApp
  notifPermission = 'default',
  notifSupported = false,
  onRequestNotifPermission = () => {},
  onTestNotification = () => {},
  onOpenAlertsModal = () => {},
  canInstall = false,
  onInstallApp = () => {}
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { unreadCount, isNotificationCenterOpen, setIsNotificationCenterOpen } = useToast();
  const menuRef = useRef(null);
  const avatarButtonRef = useRef(null);
  // Toggles de ajustes (leen localStorage en cada render del dropdown)
  const [hapticsOn, setHapticsOn] = useState(() => haptics.isEnabled());
  const [wakeLockOn, setWakeLockOn] = useState(() => wakeLockPrefs.isEnabled());

  const toggleHaptics = () => {
    const next = !hapticsOn;
    haptics.setEnabled(next);
    setHapticsOn(next);
    if (next) haptics.seriesDone(); // mini feedback al activar
  };

  const toggleWakeLock = () => {
    const next = !wakeLockOn;
    wakeLockPrefs.setEnabled(next);
    setWakeLockOn(next);
  };

  // Exact short labels in one single line as requested
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'schedule', label: 'Horario', icon: CalendarCheck2 },
    { id: 'outlier', label: 'Outlier', icon: Clock },
    { id: 'workout', label: 'Gym', icon: Dumbbell },
    { id: 'finance', label: 'Ahorro', icon: PiggyBank },
  ];

  // Close menu on click outside or Esc
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !avatarButtonRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
        avatarButtonRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  // Circular progress math for Prime % ring
  const circleRadius = 14;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (primeScore / 100) * circumference;

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-surface/90 backdrop-blur-md border-b border-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo Group */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              aria-label="Ir al inicio de PRIME OS"
              className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent group"
            >
              <PrimeLogo
                size={38}
                progress={Math.min(1, Math.max(0, (primeScore || 74) / 100))}
                interactive={true}
                className="shrink-0"
              />
              <div className="text-left">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-extrabold text-base tracking-tight text-text">PRIME</span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-surface-2 text-accent border border-border">
                    OS
                  </span>
                </div>
                <span className="text-[11px] text-text-muted hidden sm:block mt-0.5 font-medium">
                  Rendimiento & Enfoque
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation (>= md) with sliding layoutId indicator */}
          <nav
            aria-label="Navegación principal"
            className="hidden md:flex items-center gap-1 p-1 bg-surface-2 border border-border rounded-xl relative"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  onMouseEnter={() => onPreloadTab(item.id)}
                  onFocus={() => onPreloadTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent whitespace-nowrap z-10 ${
                    isActive ? 'text-slate-950 font-bold' : 'text-text-muted hover:text-text'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavTab"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute inset-0 bg-accent rounded-lg -z-10 shadow-xs"
                    />
                  )}
                  <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Prime Score + Theme + Avatar */}
          <div className="flex items-center gap-2.5">
            {/* Animated SVG Ring for Prime Score */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-2 border border-border text-xs shadow-2xs"
              title="Tu puntaje diario de Prime"
            >
              <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r={circleRadius}
                    fill="none"
                    className="stroke-border"
                    strokeWidth="3"
                  />
                  <motion.circle
                    cx="18"
                    cy="18"
                    r={circleRadius}
                    fill="none"
                    className="stroke-accent"
                    strokeWidth="3"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-black text-text">
                  <AnimatedNumber value={primeScore} />
                </div>
              </div>
              <span className="text-[11px] font-black text-accent tracking-wider uppercase hidden sm:inline">
                PRIME
              </span>
            </div>

            {/* Quick 1-Click Theme Toggle Button with tooltip */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="p-2.5 rounded-xl bg-surface-2 hover:bg-surface border border-border text-text-muted hover:text-text transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-warning" />
              ) : (
                <Moon className="w-4 h-4 text-accent" />
              )}
            </button>
            {/* WhatsApp & Push Alerts Modal Button */}
            <button
              onClick={onOpenAlertsModal}
              aria-label="Configurar alertas por WhatsApp y Push"
              title="Alertas automáticas por WhatsApp y Notificaciones Push"
              className="relative p-2.5 rounded-xl bg-surface-2 hover:bg-surface border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-2xs"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            {/* Notification Bell Button */}
            <button
              onClick={() => setIsNotificationCenterOpen(!isNotificationCenterOpen)}
              aria-label={`Centro de notificaciones: ${unreadCount} novedades`}
              title="Centro de Notificaciones y Alertas"
              className="relative p-2.5 rounded-xl bg-surface-2 hover:bg-surface border border-border text-text-muted hover:text-text transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Bell className={`w-4 h-4 transition-transform ${unreadCount > 0 ? 'text-accent scale-110' : ''}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-accent text-slate-950 text-[10px] font-mono font-black shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Avatar Dropdown Trigger */}
            <div className="relative">
              <button
                ref={avatarButtonRef}
                onClick={() => setIsMenuOpen((prev) => !prev)}
                aria-expanded={isMenuOpen}
                aria-haspopup="true"
                aria-label="Menú de perfil y configuración de usuario"
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-surface-2 hover:bg-surface border border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[44px]"
              >
                <div className="w-7 h-7 rounded-lg bg-accent-subtle border border-accent/30 flex items-center justify-center text-accent">
                  <UserCheck className="w-4 h-4" />
                </div>
                <span className="hidden sm:inline text-xs font-bold text-text">Alejo</span>
                <ChevronDown className="w-3.5 h-3.5 text-text-muted hidden sm:inline" />
              </button>

              {/* Avatar Menu Dropdown */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    ref={menuRef}
                    role="menu"
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.15 }}
                    aria-orientation="vertical"
                    className="absolute right-0 mt-2 w-72 bg-surface border border-border rounded-2xl shadow-xl p-3 z-50 text-text"
                  >
                    {/* User Profile Card */}
                    <div className="px-3 py-2.5 border-b border-border pb-3 mb-2">
                      <div className="font-bold text-sm text-text">Alejo Sierra</div>
                      <div className="text-xs text-text-muted font-mono truncate" title="alejosierra656@gmail.com">
                        alejosierra656@gmail.com
                      </div>
                      <div className="mt-1 text-[11px] text-accent font-medium">
                        Estudiante U · Tesis · Árbitro COARC · Outlier
                      </div>
                    </div>

                    {/* Theme Switcher Options */}
                    <div className="px-3 py-1.5">
                      <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2">
                        Tema de la aplicación
                      </span>
                      <div className="grid grid-cols-3 gap-1.5 bg-surface-2 p-1 rounded-xl border border-border">
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
                              role="menuitem"
                              onClick={() => setTheme(t.id)}
                              aria-label={`Activar tema ${t.label}`}
                              className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors ${
                                isSel
                                  ? 'bg-surface text-accent shadow-xs border border-border'
                                  : 'text-text-muted hover:text-text'
                              }`}
                            >
                              <TIcon className="w-3.5 h-3.5" /> {t.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ── Ajustes del sistema ── */}
                    <div className="mt-2 pt-2 border-t border-border space-y-1">
                      <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block px-3 mb-1.5">
                        Ajustes del sistema
                      </span>

                      {/* Toggle Vibración */}
                      {haptics.isSupported() && (
                        <div className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-surface-2 transition-colors">
                          <span className="flex items-center gap-2 text-xs font-semibold text-text">
                            <Smartphone className="w-3.5 h-3.5 text-accent" />
                            Vibración háptica
                          </span>
                          <button
                            role="switch"
                            aria-checked={hapticsOn}
                            aria-label={hapticsOn ? 'Desactivar vibración' : 'Activar vibración'}
                            onClick={toggleHaptics}
                            className={`relative w-10 h-5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                              hapticsOn ? 'bg-accent' : 'bg-border'
                            }`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              hapticsOn ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>
                      )}

                      {/* Toggle Wake Lock (pantalla activa) */}
                      {'wakeLock' in navigator && (
                        <div className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-surface-2 transition-colors">
                          <span className="flex items-center gap-2 text-xs font-semibold text-text">
                            <MonitorCheck className="w-3.5 h-3.5 text-accent" />
                            Pantalla activa (timers)
                          </span>
                          <button
                            role="switch"
                            aria-checked={wakeLockOn}
                            aria-label={wakeLockOn ? 'Desactivar pantalla activa' : 'Activar pantalla activa'}
                            onClick={toggleWakeLock}
                            className={`relative w-10 h-5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                              wakeLockOn ? 'bg-accent' : 'bg-border'
                            }`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              wakeLockOn ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>
                      )}

                      {/* Notificaciones del navegador */}
                      {notifSupported && (
                        <div className="px-3 py-2 rounded-xl bg-surface-2/40 border border-border/60">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-xs font-semibold text-text">
                              {notifPermission === 'granted'
                                ? <Bell className="w-3.5 h-3.5 text-success" />
                                : notifPermission === 'denied'
                                ? <BellOff className="w-3.5 h-3.5 text-danger" />
                                : <Bell className="w-3.5 h-3.5 text-text-muted" />
                              }
                              Alertas 10 PM & Agua
                            </span>
                            {notifPermission === 'granted' ? (
                              <span className="text-[10px] font-black text-success">Activo</span>
                            ) : notifPermission === 'denied' ? (
                              <span className="text-[10px] font-black text-danger">Bloqueado</span>
                            ) : (
                              <button
                                onClick={() => { setIsMenuOpen(false); onRequestNotifPermission(); }}
                                className="px-2.5 py-1 rounded-lg bg-accent text-slate-950 text-[10px] font-black hover:bg-accent-hover transition-colors min-h-[28px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                              >
                                Activar
                              </button>
                            )}
                          </div>
                          {notifPermission === 'granted' && (
                            <button
                              role="menuitem"
                              onClick={() => {
                                setIsMenuOpen(false);
                                onTestNotification();
                              }}
                              className="w-full mt-2 flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-accent bg-accent-subtle/50 hover:bg-accent-subtle transition-colors"
                            >
                              <span className="flex items-center gap-1.5">
                                <BellRing className="w-3 h-3 text-accent" /> Probar Notificación Móvil
                              </span>
                              <span className="text-[9px] text-text-muted">Vibrar</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* WhatsApp & Alertas Hub */}
                      <button
                        role="menuitem"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenAlertsModal();
                        }}
                        className="w-full mt-2 flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      >
                        <span className="flex items-center gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          Alertas WhatsApp & Push
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono">PRO</span>
                      </button>
                    </div>

                    {/* Botón PWA Install — visible solo si el navegador disparó beforeinstallprompt y no está en standalone */}
                    {canInstall && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <button
                          role="menuitem"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onInstallApp();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-accent bg-accent-subtle/50 hover:bg-accent-subtle border border-accent/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          <span className="flex items-center gap-2">
                            <Download className="w-3.5 h-3.5 text-accent" />
                            Instalar PRIME OS
                          </span>
                          <span className="text-[10px] text-accent/80 font-mono">PWA</span>
                        </button>
                      </div>
                    )}

                    {/* Duolingo Trigger */}
                    <div className="mt-2 pt-2 border-t border-border">
                      <button
                        role="menuitem"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onTriggerAlarm();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-warning bg-warning-subtle/50 hover:bg-warning-subtle transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <BellRing className="w-4 h-4 text-warning" /> Alarma Duolingo
                        </span>
                        <span className="text-[10px] text-text-muted font-normal">Probar</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (< md) with safe area and tap bounce */}
      <nav
        aria-label="Navegación inferior móvil"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border pb-[env(safe-area-inset-bottom)] transition-colors shadow-lg"
      >
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.93 }}
                onClick={() => setActiveTab(item.id)}
                onMouseEnter={() => onPreloadTab(item.id)}
                onFocus={() => onPreloadTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-1 py-1 rounded-lg text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[44px] ${
                  isActive ? 'text-accent' : 'text-text-muted hover:text-text'
                }`}
              >
                <div
                  className={`p-1 rounded-lg transition-colors ${
                    isActive ? 'bg-accent-subtle text-accent' : ''
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                </div>
                <span className="truncate max-w-[64px] text-[11px] leading-none">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* Centro de Notificaciones (Popover / Drawer) */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />
    </>
  );
}
