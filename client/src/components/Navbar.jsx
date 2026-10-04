import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarCheck2,
  Clock,
  Dumbbell,
  PiggyBank,
  Bell,
  UserCheck,
  Sun,
  Moon,
  ChevronDown,
  MessageSquare,
  Shield,
  Menu
} from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';
import { useToast } from '../hooks/useToast';
import { useKeyboardOpen } from '../hooks/useKeyboardOpen';
import NotificationCenter from './NotificationCenter';
import PrimeLogo from './PrimeLogo';
import MoreSheet from './MoreSheet';
import SettingsPanel from './SettingsPanel';

export default function Navbar({
  activeTab,
  setActiveTab,
  primeScore,
  onTriggerAlarm,
  theme,
  setTheme,
  onPreloadTab = () => {},
  notifPermission = 'default',
  notifSupported = false,
  onRequestNotifPermission = () => {},
  onTestNotification = () => {},
  onOpenAlertsModal = () => {},
  canInstall = false,
  onInstallApp = () => {}
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { unreadCount, isNotificationCenterOpen, setIsNotificationCenterOpen } = useToast();
  const isKeyboardOpen = useKeyboardOpen();

  const menuRef = useRef(null);
  const avatarButtonRef = useRef(null);
  const moreButtonRef = useRef(null);

  // Desktop navigation items (all 6 visible tabs)
  const desktopNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'schedule', label: 'Horario', icon: CalendarCheck2 },
    { id: 'outlier', label: 'Outlier', icon: Clock },
    { id: 'workout', label: 'Gym', icon: Dumbbell },
    { id: 'referee', label: 'Árbitro', icon: Shield },
    { id: 'finance', label: 'Ahorro', icon: PiggyBank }
  ];

  // Mobile navigation items (strictly 5 items in 1 row)
  const mobileNavItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'schedule', label: 'Horario', icon: CalendarCheck2 },
    { id: 'outlier', label: 'Outlier', icon: Clock },
    { id: 'workout', label: 'Gym', icon: Dumbbell }
  ];

  const isMoreActive = isMoreOpen || ['referee', 'finance'].includes(activeTab);

  // Close desktop avatar menu on click outside or Esc
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !avatarButtonRef.current?.contains(event.target)
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
  const circleRadius = 13;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - ((primeScore || 0) / 100) * circumference;

  const settingsProps = {
    theme,
    setTheme,
    notifPermission,
    notifSupported,
    onRequestNotifPermission,
    onTestNotification,
    onOpenAlertsModal,
    canInstall,
    onInstallApp,
    onTriggerAlarm
  };

  return (
    <>
      {/* ─── Top Header ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-surface/90 backdrop-blur-md border-b border-border transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] h-16 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
          
          {/* Logo Group */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              aria-label="Ir al inicio de PRIME OS"
              className="flex items-center gap-2 sm:gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent group min-w-0"
            >
              <PrimeLogo
                size={34}
                progress={Math.min(1, Math.max(0, (primeScore || 74) / 100))}
                interactive={true}
                className="shrink-0"
              />
              <div className="text-left min-w-0">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-text truncate">
                    PRIME
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-black px-1 sm:px-1.5 py-0.5 rounded bg-surface-2 text-accent border border-border shrink-0">
                    OS
                  </span>
                </div>
                <span className="text-[11px] text-text-muted hidden sm:block mt-0.5 font-medium truncate">
                  Rendimiento & Enfoque
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation (>= md) with sliding indicator */}
          <nav
            aria-label="Navegación principal"
            className="hidden md:flex items-center gap-1 p-1 bg-surface-2 border border-border rounded-xl relative"
          >
            {desktopNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  onMouseEnter={() => onPreloadTab(item.id)}
                  onFocus={() => onPreloadTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent whitespace-nowrap z-10 ${
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

          {/* Right Controls: Prime Score + Theme/Chat (desktop) + Bell + Avatar (desktop) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Animated SVG Ring for Prime Score */}
            <div
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-surface-2 border border-border text-xs shadow-2xs shrink-0"
              title="Tu puntaje diario de Prime"
            >
              <div className="relative w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shrink-0">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 -rotate-90" viewBox="0 0 34 34">
                  <circle
                    cx="17"
                    cy="17"
                    r={circleRadius}
                    fill="none"
                    className="stroke-border"
                    strokeWidth="3"
                  />
                  <motion.circle
                    cx="17"
                    cy="17"
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
                <div className="absolute inset-0 flex items-center justify-center text-[9px] sm:text-[10px] font-mono font-black text-text">
                  <AnimatedNumber value={primeScore} />
                </div>
              </div>
              <span className="text-[11px] font-black text-accent tracking-wider uppercase hidden sm:inline">
                PRIME
              </span>
            </div>

            {/* Quick 1-Click Theme Toggle Button (Desktop only, mobile has it in Más) */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="hidden md:flex p-2.5 rounded-xl bg-surface-2 hover:bg-surface border border-border text-text-muted hover:text-text transition-colors min-h-[44px] min-w-[44px] items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shrink-0"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-warning" />
              ) : (
                <Moon className="w-4 h-4 text-accent" />
              )}
            </button>

            {/* WhatsApp & Push Alerts Modal Button (Desktop only, mobile has it in Más) */}
            <button
              onClick={onOpenAlertsModal}
              aria-label="Configurar alertas por chat y push"
              title="Alertas automáticas por Telegram / WhatsApp y Notificaciones Push"
              className="hidden md:flex relative p-2.5 rounded-xl bg-surface-2 hover:bg-surface border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 transition-colors min-h-[44px] min-w-[44px] items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-2xs shrink-0"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            {/* Notification Bell Button (Both Mobile & Desktop) */}
            <button
              onClick={() => setIsNotificationCenterOpen(!isNotificationCenterOpen)}
              aria-label={`Centro de notificaciones: ${unreadCount} novedades`}
              title="Centro de Notificaciones y Alertas"
              className="relative p-2.5 rounded-xl bg-surface-2 hover:bg-surface border border-border text-text-muted hover:text-text transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shrink-0"
            >
              <Bell className={`w-4 h-4 transition-transform ${unreadCount > 0 ? 'text-accent scale-110' : ''}`} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-accent text-slate-950 text-[10px] font-mono font-black pointer-events-none ring-1.5 ring-surface">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Avatar Dropdown Trigger (Desktop only, >= md) */}
            <div className="relative hidden md:block">
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
                <span className="text-xs font-bold text-text">Alejo</span>
                <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
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
                    className="absolute right-0 mt-2 w-76 bg-surface border border-border rounded-2xl shadow-xl p-3 z-50 text-text"
                  >
                    {/* User Profile Card */}
                    <div className="px-3 py-2 border-b border-border pb-2.5 mb-2">
                      <div className="font-bold text-sm text-text">Alejo Sierra</div>
                      <div className="text-xs text-text-muted font-mono truncate" title="alejosierra656@gmail.com">
                        alejosierra656@gmail.com
                      </div>
                      <div className="mt-1 text-[11px] text-accent font-medium">
                        Estudiante U · Tesis · Árbitro COARC · Outlier
                      </div>
                    </div>

                    {/* Shared Settings */}
                    <SettingsPanel
                      {...settingsProps}
                      onAction={() => setIsMenuOpen(false)}
                      itemRole="menuitem"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Mobile Fixed Bottom Navigation Bar (< md) ──────────── */}
      {/* Máximo 5 ítems en 1 sola fila con safe-area y ocultamiento si el teclado abre */}
      <nav
        aria-label="Navegación inferior móvil"
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border pb-[env(safe-area-inset-bottom)] transition-transform duration-200 shadow-lg ${
          isKeyboardOpen ? 'translate-y-full pointer-events-none' : 'translate-y-0'
        }`}
      >
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1 items-center">
          {/* Primeros 4 ítems: Inicio, Horario, Outlier, Gym */}
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  setActiveTab(item.id);
                  if (isMoreOpen) setIsMoreOpen(false);
                }}
                onMouseEnter={() => onPreloadTab(item.id)}
                onFocus={() => onPreloadTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center gap-1 py-1 rounded-xl text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[48px] h-full ${
                  isActive ? 'text-accent' : 'text-text-muted hover:text-text'
                }`}
              >
                <div
                  className={`p-1 rounded-xl transition-colors ${
                    isActive ? 'bg-accent-subtle text-accent' : ''
                  }`}
                >
                  <Icon className="w-6 h-6 shrink-0" aria-hidden="true" />
                </div>
                <span className="truncate max-w-[62px] text-[11px] leading-none font-semibold">
                  {item.label}
                </span>
              </motion.button>
            );
          })}

          {/* 5º ítem: "Más" (Árbitro y Reglas, Ahorro, Ajustes, Notificaciones) */}
          <motion.button
            ref={moreButtonRef}
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsMoreOpen((prev) => !prev)}
            aria-expanded={isMoreOpen}
            aria-haspopup="dialog"
            aria-label="Más opciones: Árbitro, Ahorro, Ajustes y Notificaciones"
            className={`relative flex flex-col items-center justify-center gap-1 py-1 rounded-xl text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[48px] h-full ${
              isMoreActive ? 'text-accent' : 'text-text-muted hover:text-text'
            }`}
          >
            <div
              className={`relative p-1 rounded-xl transition-colors ${
                isMoreActive ? 'bg-accent-subtle text-accent' : ''
              }`}
            >
              <Menu className="w-6 h-6 shrink-0" aria-hidden="true" />
              {unreadCount > 0 && (
                <span
                  aria-label={`${unreadCount} notificaciones pendientes`}
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent ring-2 ring-surface"
                />
              )}
            </div>
            <span className="truncate max-w-[62px] text-[11px] leading-none font-semibold">
              Más
            </span>
          </motion.button>
        </div>
      </nav>

      {/* ─── Hoja "Más" para Móvil ──────────────────────────────── */}
      <MoreSheet
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        activeTab={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setIsMoreOpen(false);
        }}
        onOpenNotifications={() => {
          setIsMoreOpen(false);
          setIsNotificationCenterOpen(true);
        }}
        unreadCount={unreadCount}
        settingsProps={settingsProps}
        returnFocusRef={moreButtonRef}
      />

      {/* ─── Centro de Notificaciones (Popover / Drawer) ────────── */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />
    </>
  );
}
