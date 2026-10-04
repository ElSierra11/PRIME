import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';
import Navbar from './components/Navbar';
import ToastContainer from './components/ToastContainer';
import DuolingoSleepModal from './components/DuolingoSleepModal';
import AlertsWhatsAppModal from './components/AlertsWhatsAppModal';
import TabSkeleton from './components/TabSkeleton';
import DashboardTab from './tabs/DashboardTab';
const ScheduleTab = lazy(() => import('./tabs/ScheduleTab'));
const OutlierTab  = lazy(() => import('./tabs/OutlierTab'));
const WorkoutTab  = lazy(() => import('./tabs/WorkoutTab'));
const FinanceTab  = lazy(() => import('./tabs/FinanceTab'));
import { sounds } from './utils/audio';
import { useTheme } from './utils/useTheme';
import { useNotifications } from './hooks/useNotifications';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { ToastProvider, useToast } from './context/ToastContext';
import { useReminders } from './hooks/useReminders';

const preloadMap = {
  schedule: () => import('./tabs/ScheduleTab'),
  outlier:  () => import('./tabs/OutlierTab'),
  workout:  () => import('./tabs/WorkoutTab'),
  finance:  () => import('./tabs/FinanceTab')
};

function AppContent({ activeTab, setActiveTab }) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [isSleepAlarmOpen, setIsSleepAlarmOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);

  // Today's day index: 0 = Lunes, 6 = Domingo
  const getTodayDayIndex = () => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  };
  const [selectedDay, setSelectedDay] = useState(getTodayDayIndex());

  // Backend state
  const [userProfile, setUserProfile] = useState(null);
  const [scheduleDayData, setScheduleDayData] = useState(null);
  const [outlierStats, setOutlierStats] = useState(null);
  const [habitsData, setHabitsData] = useState(null);
  const [financeOverview, setFinanceOverview] = useState(null);

  // Helper compatible para pasar a tabs existentes
  const addToast = (opts) => toast(opts);

  // ── PWA: SW update banner ────────────────────────────────────
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(r) {
      if (r) setInterval(() => r.update(), 60 * 60 * 1000);
    }
  });

  // ── Notificaciones del navegador (Alarma 10:00 PM, Calendario y Agua) ──────
  const {
    permission: notifPermission,
    isSupported: notifSupported,
    isPushSubscribed,
    requestPermission,
    testNotification
  } = useNotifications({
    isSleepConfirmed: !!habitsData?.sleep?.confirmedAsleep,
    currentWaterMl: habitsData?.water?.currentMl || 0,
    waterTargetMl: habitsData?.water?.goalMl || habitsData?.water?.targetMl || 2500,
    scheduleEvents: scheduleDayData?.events || [],
    addToast
  });

  // ── PWA: Instalación (beforeinstallprompt) ───────────────────
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(isStandaloneMode);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      toast.success({
        title: '¡PRIME OS instalada!',
        message: 'La aplicación ya está disponible en tu pantalla de inicio.'
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      toast.info({
        title: 'Instalar en iPhone / Safari',
        message: 'Toca el botón Compartir de Safari y selecciona "Añadir a pantalla de inicio".'
      });
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // ── Fetch Inicial de Microservicios en Paralelo ─────────────
  const fetchAllData = async () => {
    try {
      const [resProfile, resSchedule, resOutlier, resHabits, resFinance] = await Promise.allSettled([
        fetch('/api/auth/profile').then(r => r.json()),
        fetch(`/api/schedule/day/${selectedDay}`).then(r => r.json()),
        fetch('/api/outlier/stats').then(r => r.json()),
        fetch('/api/habits/status').then(r => r.json()),
        fetch('/api/finance/overview').then(r => r.json())
      ]);

      if (resProfile.status === 'fulfilled' && resProfile.value?.success) {
        setUserProfile(resProfile.value.profile);
      }
      if (resSchedule.status === 'fulfilled' && resSchedule.value?.success) {
        setScheduleDayData(resSchedule.value);
      }
      if (resOutlier.status === 'fulfilled' && resOutlier.value?.success) {
        setOutlierStats(resOutlier.value);
      }
      if (resHabits.status === 'fulfilled' && resHabits.value?.success) {
        setHabitsData(resHabits.value);
      }
      if (resFinance.status === 'fulfilled' && resFinance.value?.success) {
        setFinanceOverview(resFinance.value);
      }
    } catch (err) {
      console.error('Error cargando microservicios:', err);
    } finally {
      if (typeof window !== 'undefined' && typeof window.primeSplashDone === 'function') {
        window.primeSplashDone();
      }
    }
  };

  const fetchScheduleDay = async (day) => {
    try {
      const res = await fetch(`/api/schedule/day/${day}`);
      const data = await res.json();
      if (data.success) setScheduleDayData(data);
    } catch (e) {
      console.error('Error fetching schedule day:', e);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    fetchScheduleDay(selectedDay);
  }, [selectedDay]);

  // Periodic Bedtime Checker (10:00 PM Duolingo Alarm)
  useEffect(() => {
    const checkBedtime = () => {
      const now = new Date();
      if (now.getHours() >= 22 || now.getHours() < 5) {
        if (!habitsData?.sleep?.confirmedAsleep) {
          setIsSleepAlarmOpen(true);
        }
      }
    };

    const timer = setInterval(checkBedtime, 60000);
    return () => clearInterval(timer);
  }, [habitsData]);

  // ── Actions for Habits (con Deshacer) ─────────────────────────
  const handleDrinkWater = async (amountMl) => {
    try {
      const res = await fetch('/api/habits/water/drink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountMl })
      });
      const data = await res.json();
      if (data.success) setHabitsData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetWater = async () => {
    try {
      const res = await fetch('/api/habits/water/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setHabitsData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleChore = async (choreId) => {
    try {
      const res = await fetch('/api/habits/chore/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: choreId })
      });
      const data = await res.json();
      if (data.success) {
        setHabitsData(data);
        sounds.playSuccessChime();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmSleep = async () => {
    try {
      await fetch('/api/habits/sleep/confirm', { method: 'POST' });
      setIsSleepAlarmOpen(false);
      sounds.playSuccessChime();
      toast.success({
        title: '¡A descansar, Alejo!',
        message: 'Alarmas desactivadas. Mañana tu cuerpo estará en su Prime.'
      });
      fetchAllData();
    } catch (e) {
      console.error(e);
    }
  };

  // ── Actions for Schedule (con Deshacer) ───────────────────────
  const handleAddEvent = async (eventData) => {
    try {
      const res = await fetch('/api/schedule/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      const data = await res.json();
      if (data.success) {
        fetchScheduleDay(selectedDay);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    const deletedEvent = scheduleDayData?.events?.find((e) => e.id === eventId);
    try {
      const res = await fetch(`/api/schedule/delete/${eventId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchScheduleDay(selectedDay);
        if (deletedEvent) {
          toast.undo({
            title: 'Compromiso eliminado',
            message: `"${deletedEvent.title}" fue retirado de tu horario.`,
            category: 'schedule',
            onUndo: async () => {
              await handleAddEvent(deletedEvent);
              toast.success({
                title: 'Compromiso restaurado',
                message: `"${deletedEvent.title}" volvió a tu horario.`
              });
            }
          });
        } else {
          toast.info({
            title: 'Evento eliminado',
            message: 'Se retiró el compromiso de tu agenda.'
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ── Actions for Outlier ───────────────────────────────────────
  const handleLogOutlierSession = async (sessionData) => {
    try {
      const res = await fetch('/api/outlier/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
      const data = await res.json();
      if (data.success) {
        const resStats = await fetch('/api/outlier/stats');
        const dataStats = await resStats.json();
        if (dataStats.success) setOutlierStats(dataStats);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateOutlierRate = async (rate) => {
    try {
      const res = await fetch('/api/outlier/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate })
      });
      const data = await res.json();
      if (data.success) {
        const resStats = await fetch('/api/outlier/stats');
        const dataStats = await resStats.json();
        if (dataStats.success) setOutlierStats(dataStats);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ── Actions for Finance (con Deshacer) ────────────────────────
  const handleEvaluateExpense = async (expenseData) => {
    try {
      const res = await fetch('/api/finance/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...expenseData,
          ratePerHourUSD: outlierStats?.ratePerHourUSD || 15
        })
      });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSaving = async (savingData) => {
    try {
      const res = await fetch('/api/finance/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savingData)
      });
      const data = await res.json();
      if (data.success) {
        const resFinance = await fetch('/api/finance/overview');
        const dataFinance = await resFinance.json();
        if (dataFinance.success) setFinanceOverview(dataFinance);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateFinanceGoals = async ({ currentSavedCOP, monthlyGoalCOP }) => {
    try {
      const res = await fetch('/api/finance/update-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentSavedCOP, monthlyGoalCOP })
      });
      const data = await res.json();
      if (data.success) {
        const resFinance = await fetch('/api/finance/overview');
        const dataFinance = await resFinance.json();
        if (dataFinance.success) setFinanceOverview(dataFinance);
        toast.success({
          title: 'Ahorros actualizados',
          message: 'Tu balance y meta mensual se guardaron con éxito.'
        });
      }
    } catch (e) {
      console.error(e);
      toast.error({
        title: 'Error al actualizar',
        message: 'No se pudieron guardar los cambios en finanzas.'
      });
    }
  };

  const handleDeleteSaving = async (savingId) => {
    const deletedSaving = financeOverview?.savingsRecords?.find((s) => s.id === savingId);
    try {
      const res = await fetch(`/api/finance/saving/${savingId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        const resFinance = await fetch('/api/finance/overview');
        const dataFinance = await resFinance.json();
        if (dataFinance.success) setFinanceOverview(dataFinance);

        if (deletedSaving) {
          toast.undo({
            title: 'Victoria de ahorro eliminada',
            message: `"${deletedSaving.title}" fue retirada de tus registros.`,
            category: 'finance',
            onUndo: async () => {
              await handleAddSaving({ title: deletedSaving.title, amountCOP: deletedSaving.amountCOP });
              toast.success({
                title: 'Ahorro restaurado',
                message: `Victoria de ${deletedSaving.title} restablecida.`
              });
            }
          });
        } else {
          toast.info({
            title: 'Registro retirado',
            message: 'Se eliminó la victoria de ahorro seleccionada.'
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ── Capa useReminders (SSE en vivo + Polling de Respaldo) ─────
  useReminders({
    onAction: async (actionType, payload) => {
      if (actionType === 'drink_water') {
        await handleDrinkWater(payload?.amount || 250);
      } else if (actionType === 'toggle_chore') {
        await handleToggleChore(payload?.id);
      }
    }
  });

  const preloadTab = (tabId) => {
    if (preloadMap[tabId]) preloadMap[tabId]();
  };

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="min-h-screen flex flex-col bg-bg text-text antialiased selection:bg-accent selection:text-slate-950 transition-colors relative overflow-x-hidden">
        {/* Ambient Background Blobs */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="ambient-blob-1 absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-75" />
          <div className="ambient-blob-2 absolute top-1/3 -right-32 w-80 h-80 rounded-full blur-3xl opacity-60" />
          <div className="ambient-blob-3 absolute -bottom-32 left-1/3 w-96 h-96 rounded-full blur-3xl opacity-50" />
        </div>

        {/* Skip to Content Accessible Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-slate-950 focus:rounded-lg focus:font-bold shadow-lg"
        >
          Saltar al contenido principal
        </a>

        {/* Dynamic Top Navbar & Mobile Bottom Bar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          primeScore={habitsData?.primeScore || 85}
          onTriggerAlarm={() => setIsSleepAlarmOpen(true)}
          theme={theme}
          setTheme={setTheme}
          onPreloadTab={preloadTab}
          notifPermission={notifPermission}
          notifSupported={notifSupported}
          onRequestNotifPermission={requestPermission}
          onTestNotification={testNotification}
          onOpenAlertsModal={() => setIsAlertsModalOpen(true)}
          canInstall={!!deferredPrompt && !isStandalone}
          onInstallApp={handleInstallApp}
        />

        {/* PWA Update Banner */}
        {needRefresh && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-2xl shadow-xl text-xs font-bold text-text w-max max-w-[90vw]"
          >
            <span>Nueva versión de PRIME OS disponible</span>
            <button
              onClick={() => updateServiceWorker(true)}
              className="px-3 py-1.5 rounded-xl bg-accent text-slate-950 font-black text-[11px] hover:bg-accent-hover transition-colors min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Actualizar
            </button>
            <button
              onClick={() => setNeedRefresh(false)}
              aria-label="Descartar notificación de actualización"
              className="p-1 rounded-lg text-text-muted hover:text-text transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
            >
              ×
            </button>
          </div>
        )}

        {/* Main Content Area with AnimatePresence Tab Transition */}
        <main
          id="main-content"
          tabIndex="-1"
          className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-12 focus:outline-none"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {activeTab === 'dashboard' && (
                <DashboardTab
                  habitsData={habitsData}
                  onDrinkWater={handleDrinkWater}
                  onResetWater={handleResetWater}
                  onToggleChore={handleToggleChore}
                  scheduleDayData={scheduleDayData}
                  outlierStats={outlierStats}
                  setActiveTab={setActiveTab}
                  addToast={addToast}
                />
              )}

              {activeTab === 'schedule' && (
                <Suspense fallback={<TabSkeleton />}>
                  <ScheduleTab
                    scheduleDayData={scheduleDayData}
                    selectedDay={selectedDay}
                    setSelectedDay={setSelectedDay}
                    onAddEvent={handleAddEvent}
                    onDeleteEvent={handleDeleteEvent}
                    onOpenAlertsModal={() => setIsAlertsModalOpen(true)}
                    addToast={addToast}
                  />
                </Suspense>
              )}

              {activeTab === 'outlier' && (
                <Suspense fallback={<TabSkeleton />}>
                  <OutlierTab
                    outlierStats={outlierStats}
                    onLogSession={handleLogOutlierSession}
                    onUpdateRate={handleUpdateOutlierRate}
                    addToast={addToast}
                  />
                </Suspense>
              )}

              {activeTab === 'workout' && (
                <Suspense fallback={<TabSkeleton />}>
                  <WorkoutTab addToast={addToast} />
                </Suspense>
              )}

              {activeTab === 'finance' && (
                <Suspense fallback={<TabSkeleton />}>
                  <FinanceTab
                    financeOverview={financeOverview}
                    onEvaluateExpense={handleEvaluateExpense}
                    onAddSaving={handleAddSaving}
                    onUpdateGoals={handleUpdateFinanceGoals}
                    onDeleteSaving={handleDeleteSaving}
                    addToast={addToast}
                  />
                </Suspense>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Duolingo Persistent Nagging Sleep Alarm */}
        <DuolingoSleepModal
          isOpen={isSleepAlarmOpen}
          onConfirmSleep={handleConfirmSleep}
          chores={habitsData?.chores || []}
          onToggleChore={handleToggleChore}
          onSnooze={() => {
            setIsSleepAlarmOpen(false);
            toast.warning({
              title: 'Alarma pospuesta 5 minutos',
              message: 'La alarma volverá a sonar si no te acuestas.'
            });
          }}
        />

        {/* Hub de Alertas WhatsApp, Push y Calendario */}
        <AlertsWhatsAppModal
          isOpen={isAlertsModalOpen}
          onClose={() => setIsAlertsModalOpen(false)}
          notifPermission={notifPermission}
          isPushSubscribed={isPushSubscribed}
          onRequestPushPermission={requestPermission}
          onTestPushNotification={testNotification}
          selectedDay={selectedDay}
        />

        {/* Unified Toast Container */}
        <ToastContainer />
      </div>
    </LazyMotion>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <ToastProvider onNavigateTab={setActiveTab}>
      <AppContent activeTab={activeTab} setActiveTab={setActiveTab} />
    </ToastProvider>
  );
}
