import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  AlertTriangle,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  MapPin,
  GraduationCap,
  BookOpen,
  Briefcase,
  Dumbbell,
  Shield,
  Users,
  Info,
  Download,
  ExternalLink,
  FileText,
  Smartphone,
  MessageSquare,
  Copy,
  Bell,
  Send
} from 'lucide-react';
import { useToast } from '../hooks/useToast';

export default function ScheduleTab({
  scheduleDayData,
  selectedDay,
  setSelectedDay,
  onAddEvent,
  onDeleteEvent,
  onOpenAlertsModal = () => {},
  addToast: addToastProp
}) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState('auto'); // 'auto' (desktop=week, mobile=day), 'week', 'day'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState('week'); // 'week' | 'day'
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  const [isConflictPanelOpen, setIsConflictPanelOpen] = useState(true);
  const [hoveredEventId, setHoveredEventId] = useState(null);
  const [allWeekEvents, setAllWeekEvents] = useState([]);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  const handleDownloadICS = () => {
    const url = exportType === 'day'
      ? `/api/schedule/export-ics?day=${selectedDay}`
      : '/api/schedule/export-ics';
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', exportType === 'day' ? `prime_horario_${days[selectedDay].toLowerCase()}.ics` : 'prime_horario_alejo.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success({
      title: 'Archivo .ics descargado',
      message: 'Listo para abrir en Google Calendar o Apple Calendar en tu celular o PC.',
      category: 'schedule'
    });
  };

  const handleAddToGoogleCalendar = (ev) => {
    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);

    const eventDate = new Date(monday);
    eventDate.setDate(monday.getDate() + (ev.day !== undefined ? ev.day : selectedDay));

    const pad = (n) => String(n).padStart(2, '0');
    const [sH, sM] = (ev.start || '09:00').split(':').map(Number);
    const [eH, eM] = (ev.end || '10:00').split(':').map(Number);

    const y = eventDate.getFullYear();
    const mo = pad(eventDate.getMonth() + 1);
    const d = pad(eventDate.getDate());

    const startStr = `${y}${mo}${d}T${pad(sH)}${pad(sM)}00`;
    const endStr = `${y}${mo}${d}T${pad(eH)}${pad(eM)}00`;

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(ev.notes || 'Compromiso PRIME OS')}&location=${encodeURIComponent(ev.notes || '')}`;
    window.open(url, '_blank');
  };

  const handleSendWhatsAppEvent = async (ev) => {
    try {
      const res = await fetch('/api/notifications/whatsapp/send-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: ev, is15Min: false })
      });
      const data = await res.json();
      if (data.success) {
        toast.success({
          title: 'Recordatorio enviado a WhatsApp',
          message: `"${ev.title}" enviado a tu número de WhatsApp.`
        });
      } else {
        const text = encodeURIComponent(`⚡ *PRIME OS - Recordatorio*\n\n📌 *${ev.title}*\n⏰ Horario: ${ev.start} - ${ev.end}\n${ev.notes ? '📝 ' + ev.notes : ''}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
      }
    } catch (err) {
      toast.error({ title: 'Error', message: err.message });
    }
  };

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('university');
  const [formStart, setFormStart] = useState('09:00');
  const [formEnd, setFormEnd] = useState('10:30');
  const [formNotes, setFormNotes] = useState('');

  const modalRef = useRef(null);
  const titleInputRef = useRef(null);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const shortDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Current real-world today index (0 = Lunes, 6 = Domingo)
  const realTodayIndex = useMemo(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  }, []);

  // Update real-time clock every 60 seconds
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    };
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all week events to power the weekly overview on desktop
  const fetchAllWeek = async () => {
    try {
      const res = await fetch('/api/schedule/all');
      const data = await res.json();
      if (data.success && Array.isArray(data.events)) {
        setAllWeekEvents(data.events);
      }
    } catch (e) {
      console.error('Error fetching all schedule events:', e);
    }
  };

  useEffect(() => {
    fetchAllWeek();
  }, [scheduleDayData]);

  // Focus trap & Esc for Modal
  useEffect(() => {
    if (!isAddModalOpen) return;
    titleInputRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsAddModalOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isAddModalOpen]);

  // Data helpers
  const dayEvents = useMemo(() => {
    const raw = scheduleDayData?.events || [];
    if (activeCategoryFilter === 'all') return raw;
    return raw.filter((ev) => ev.category === activeCategoryFilter);
  }, [scheduleDayData, activeCategoryFilter]);

  const conflicts = scheduleDayData?.conflicts || [];
  const freeSlots = scheduleDayData?.freeSlots || [];

  const conflictEventIds = useMemo(() => {
    const set = new Set();
    conflicts.forEach((c) => {
      if (c.eventA?.id) set.add(c.eventA.id);
      if (c.eventB?.id) set.add(c.eventB.id);
    });
    return set;
  }, [conflicts]);

  // Category metadata & styles
  const getCategoryMeta = (category) => {
    switch (category) {
      case 'university':
        return {
          label: 'Universidad',
          icon: BookOpen,
          badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
          accentBorder: 'border-l-blue-500'
        };
      case 'thesis':
        return {
          label: 'Trabajo de Grado',
          icon: GraduationCap,
          badgeClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
          accentBorder: 'border-l-purple-500'
        };
      case 'family':
        return {
          label: 'Familia',
          icon: Users,
          badgeClass: 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/30',
          accentBorder: 'border-l-pink-500'
        };
      case 'outlier':
        return {
          label: 'Outlier (3-4h)',
          icon: Briefcase,
          badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          accentBorder: 'border-l-emerald-500'
        };
      case 'referee':
        return {
          label: 'Arbitraje COARC',
          icon: Shield,
          badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
          accentBorder: 'border-l-amber-500'
        };
      case 'gym':
        return {
          label: 'Gym Prime (60m)',
          icon: Dumbbell,
          badgeClass: 'bg-accent-subtle text-accent border-accent/30',
          accentBorder: 'border-l-accent'
        };
      default:
        return {
          label: 'General',
          icon: Clock,
          badgeClass: 'bg-surface-2 text-text-muted border-border',
          accentBorder: 'border-l-border'
        };
    }
  };

  const categoriesFilterList = [
    { id: 'all', label: 'Todos' },
    { id: 'university', label: 'Universidad' },
    { id: 'thesis', label: 'Tesis' },
    { id: 'outlier', label: 'Outlier' },
    { id: 'referee', label: 'Arbitraje' },
    { id: 'gym', label: 'Gym' },
    { id: 'family', label: 'Familia' }
  ];

  // Helper to parse time string "08:30" into total minutes
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Helper to format minutes to nice duration (e.g. "1h 30m")
  const formatDuration = (startStr, endStr) => {
    const diff = timeToMinutes(endStr) - timeToMinutes(startStr);
    if (diff <= 0) return '';
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  // Mobile swipe handlers for day switching
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    const diffY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Horizontal swipe threshold: 50px, ignore vertical scrolling
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        // Swipe left -> Next day
        setSelectedDay((prev) => (prev < 6 ? prev + 1 : 0));
      } else {
        // Swipe right -> Prev day
        setSelectedDay((prev) => (prev > 0 ? prev - 1 : 6));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    onAddEvent({
      day: selectedDay,
      title: formTitle.trim(),
      category: formCategory,
      start: formStart,
      end: formEnd,
      notes: formNotes.trim()
    });

    setIsAddModalOpen(false);
    setFormTitle('');
    setFormNotes('');
    toast.success({
      title: 'Compromiso guardado',
      message: `"${formTitle}" añadido al horario de ${days[selectedDay]}.`,
      category: 'schedule'
    });
  };

  // Stagger animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } }
  };

  // Format current live time for the "now" line badge
  const formattedLiveTime = useMemo(() => {
    const h = Math.floor(currentTimeMinutes / 60);
    const m = currentTimeMinutes % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
  }, [currentTimeMinutes]);

  return (
    <div className="space-y-6">
      {/* Top Header & Day Selector Bar */}
      <section
        aria-label="Controles del horario"
        className="bg-surface border border-border p-4 sm:p-5 rounded-2xl shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-text tracking-tight flex items-center gap-2">
                <Calendar className="w-6 h-6 text-accent" />
                Mi Horario y Auditor Prime
              </h1>
              {selectedDay === realTodayIndex && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-accent text-slate-950 shadow-xs">
                  Hoy
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Organiza clases, Trabajo de Grado, arbitraje COARC, Gym y Outlier sin solapamientos.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* View Mode Toggle for Desktop */}
            <div className="hidden lg:flex items-center bg-surface-2 p-1 rounded-xl border border-border text-xs font-bold">
              <button
                onClick={() => setViewMode('auto')}
                className={`px-3 py-1.5 rounded-lg transition-colors min-h-[36px] ${
                  viewMode === 'auto'
                    ? 'bg-accent text-slate-950 font-black shadow-xs'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Vista Semanal
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 rounded-lg transition-colors min-h-[36px] ${
                  viewMode === 'day'
                    ? 'bg-accent text-slate-950 font-black shadow-xs'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Día Detallado
              </button>
            </div>

            <button
              onClick={() => onOpenAlertsModal()}
              className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs sm:text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[44px] shadow-2xs active:scale-[0.98]"
              title="Configurar recordatorios automáticos por WhatsApp y Notificaciones Push"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Alertas &amp;</span> <span>WhatsApp</span>
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-surface-2 hover:bg-surface border border-border text-text font-bold text-xs sm:text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[44px] shadow-2xs active:scale-[0.98]"
              title="Sincronizar y exportar a Google Calendar (.ics)"
            >
              <Download className="w-4 h-4 text-accent" />
              <span className="hidden sm:inline">Exportar</span> <span>.ics</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-black text-xs sm:text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[44px] shadow-xs active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" /> Agregar Compromiso
            </button>
          </div>
        </div>

        {/* Day Selector with Sliding Pill (layoutId) */}
        <div className="relative">
          <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-surface-2 rounded-xl border border-border no-scrollbar">
            {days.map((dayName, idx) => {
              const isSelected = selectedDay === idx;
              const isToday = idx === realTodayIndex;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDay(idx)}
                  aria-pressed={isSelected}
                  className={`relative flex-1 min-w-[76px] sm:min-w-0 px-2.5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-colors whitespace-nowrap min-h-[44px] flex flex-col items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent z-10 ${
                    isSelected ? 'text-slate-950 font-black' : 'text-text-muted hover:text-text'
                  }`}
                >
                  {/* Sliding pill indicator */}
                  {isSelected && (
                    <motion.div
                      layoutId="activeScheduleDay"
                      className="absolute inset-0 bg-accent rounded-lg shadow-sm -z-10"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="leading-tight">{shortDays[idx]}</span>
                  {isToday && (
                    <span
                      className={`text-[9px] font-black uppercase mt-0.5 ${
                        isSelected ? 'text-slate-950/80' : 'text-accent'
                      }`}
                    >
                      Hoy
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar">
          <span className="text-xs font-bold text-text-muted flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filtrar:
          </span>
          {categoriesFilterList.map((cat) => {
            const isActive = activeCategoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all min-h-[36px] border ${
                  isActive
                    ? 'bg-accent/20 text-accent border-accent/40 shadow-xs'
                    : 'bg-surface-2 text-text-muted border-border hover:text-text hover:bg-surface'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Conflicts Auditor Banner with Animated Expansion */}
      {conflicts.length > 0 && (
        <aside
          role="alert"
          aria-label="Auditor de conflictos de horario"
          className="rounded-2xl bg-warning-subtle border border-warning/30 text-text shadow-xs overflow-hidden transition-all"
        >
          <div className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-warning/20 text-warning shrink-0 mt-0.5 sm:mt-0 animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-warning">
                  Auditor: {conflicts.length} solapamiento(s) detectado(s) en {days[selectedDay]}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Hay actividades programadas en los mismos bloques de tiempo.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsConflictPanelOpen((prev) => !prev)}
              aria-expanded={isConflictPanelOpen}
              className="px-3 py-1.5 rounded-xl bg-surface/70 hover:bg-surface border border-warning/30 text-text font-bold text-xs flex items-center gap-1.5 transition-colors min-h-[40px] shrink-0"
            >
              <span>{isConflictPanelOpen ? 'Ocultar' : 'Ver detalle'}</span>
              {isConflictPanelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <AnimatePresence>
            {isConflictPanelOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="border-t border-warning/20 bg-warning/5 px-4 sm:px-6 py-4 space-y-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {conflicts.map((c, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-surface border border-warning/40 shadow-xs space-y-2"
                    >
                      <div className="flex items-center gap-1.5 text-warning font-black text-xs uppercase tracking-wide">
                        <AlertTriangle className="w-3.5 h-3.5" /> Conflicto #{i + 1}
                      </div>
                      <div className="text-xs space-y-1 text-text leading-relaxed">
                        <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-surface-2">
                          <span className="font-bold truncate">{c.eventA.title}</span>
                          <span className="font-mono text-[11px] font-bold text-accent shrink-0">
                            {c.eventA.start} – {c.eventA.end}
                          </span>
                        </div>
                        <div className="text-center text-[10px] font-bold text-warning uppercase">coincide con</div>
                        <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-surface-2">
                          <span className="font-bold truncate">{c.eventB.title}</span>
                          <span className="font-mono text-[11px] font-bold text-accent shrink-0">
                            {c.eventB.start} – {c.eventB.end}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-text-muted pt-1 border-t border-border">
                        💡 <strong>Sugerencia Prime:</strong> Revisa asistencias en la U o delega el arbitraje/traslado para no afectar tu promedio académico.
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      )}

      {/* DESKTOP WEEKLY GRID (Visible when viewMode is 'auto' or 'week' on large screens) */}
      <section
        aria-label="Vista semanal de compromisos"
        className={`${
          viewMode === 'day' ? 'hidden' : 'hidden lg:block'
        } bg-surface border border-border p-5 rounded-2xl shadow-xs space-y-4`}
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-base font-bold text-text flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              Semana Completa de un Vistazo
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Haz clic en cualquier día para seleccionarlo y gestionar sus bloques.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            Hora actual: <strong>{formattedLiveTime}</strong>
          </div>
        </div>

        {/* 7-column grid for 7 days without horizontal page scroll */}
        <div className="grid grid-cols-7 gap-2.5">
          {days.map((dayName, dayIdx) => {
            const isSelected = selectedDay === dayIdx;
            const isToday = dayIdx === realTodayIndex;
            const dayList = (allWeekEvents.length > 0 ? allWeekEvents : scheduleDayData?.events || [])
              .filter((ev) => ev.day === dayIdx)
              .filter((ev) => activeCategoryFilter === 'all' || ev.category === activeCategoryFilter)
              .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

            return (
              <div
                key={dayIdx}
                onClick={() => setSelectedDay(dayIdx)}
                className={`rounded-xl border p-2.5 transition-all cursor-pointer flex flex-col justify-between min-h-[380px] ${
                  isSelected
                    ? 'bg-accent/5 border-accent ring-2 ring-accent/30 shadow-sm'
                    : 'bg-surface-2/60 border-border hover:bg-surface-2 hover:border-border'
                }`}
              >
                {/* Column Day Header */}
                <div className="border-b border-border/80 pb-2 mb-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isSelected ? 'text-accent' : 'text-text'}`}>
                      {shortDays[dayIdx]}
                    </span>
                    {isToday && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-accent text-slate-950">
                        Hoy
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-text-muted font-mono">{dayList.length} eventos</span>
                </div>

                {/* Event mini blocks with staggered animation */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-1.5 flex-1 relative"
                >
                  {/* Real-time "NOW" indicator line if today */}
                  {isToday && (
                    <div
                      className="my-2 border-t-2 border-accent border-dashed relative flex items-center"
                      title={`Hora actual: ${formattedLiveTime}`}
                    >
                      <span className="absolute -left-1 w-2 h-2 rounded-full bg-accent animate-ping" />
                      <span className="absolute -left-1 w-2 h-2 rounded-full bg-accent" />
                      <span className="ml-2 text-[9px] font-mono font-bold text-accent bg-surface px-1 py-0.2 rounded shadow-xs">
                        {formattedLiveTime}
                      </span>
                    </div>
                  )}

                  {dayList.length === 0 ? (
                    <div className="py-8 text-center text-text-muted text-[11px] italic">Libre</div>
                  ) : (
                    dayList.map((ev) => {
                      const meta = getCategoryMeta(ev.category);
                      const hasConflict = conflictEventIds.has(ev.id);
                      const isHovered = hoveredEventId === ev.id;

                      return (
                        <div
                          key={ev.id}
                          onMouseEnter={() => setHoveredEventId(ev.id)}
                          onMouseLeave={() => setHoveredEventId(null)}
                          className={`relative p-2 rounded-lg text-[11px] border transition-all ${
                            hasConflict
                              ? 'bg-warning-subtle border-warning/50 ring-1 ring-warning animate-pulse'
                              : 'bg-surface border-border hover:border-accent/50 hover:shadow-xs'
                          } ${meta.accentBorder} border-l-2`}
                        >
                          <div className="flex items-center justify-between gap-1 text-[10px] font-mono font-semibold text-text-muted">
                            <span>{ev.start}</span>
                            <span>{formatDuration(ev.start, ev.end)}</span>
                          </div>
                          <div className="font-bold text-text truncate mt-0.5">{ev.title}</div>

                          {/* Hover Tooltip with complete event details */}
                          <AnimatePresence>
                            {isHovered && (
                              <motion.div
                                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2.5 rounded-xl bg-slate-950 text-white border border-slate-700 shadow-xl z-50 text-left pointer-events-none"
                              >
                                <div className="text-[10px] font-mono text-accent font-bold">
                                  {ev.start} – {ev.end} ({formatDuration(ev.start, ev.end)})
                                </div>
                                <div className="font-bold text-xs text-white mt-1 leading-tight">{ev.title}</div>
                                <div className="text-[10px] text-slate-300 mt-1 flex items-center gap-1">
                                  <span className="capitalize">{meta.label}</span>
                                </div>
                                {ev.notes && (
                                  <div className="text-[10px] text-slate-400 mt-1 italic flex items-center gap-1 border-t border-slate-800 pt-1">
                                    <MapPin className="w-3 h-3 text-accent shrink-0" />
                                    <span className="truncate">{ev.notes}</span>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                  )}
                </motion.div>

                {/* Day selector button footer */}
                <div className="pt-2 border-t border-border/80 text-center">
                  <span className="text-[10px] font-bold text-accent">Gestionar →</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FOCUSED DAY VIEW: Swipeable on mobile, detailed cards, timeline + free windows */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Main Day Timeline (2 Cols on lg) */}
        <section
          aria-labelledby="day-timeline-heading"
          className="lg:col-span-2 bg-surface border border-border p-5 sm:p-6 rounded-2xl space-y-4 shadow-xs"
        >
          {/* Day Navigation & Header */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedDay((prev) => (prev > 0 ? prev - 1 : 6))}
                aria-label="Día anterior"
                className="p-2 rounded-xl bg-surface-2 text-text-muted hover:text-text hover:bg-surface border border-border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 id="day-timeline-heading" className="text-base sm:text-lg font-bold text-text flex items-center gap-2">
                  <span>Agenda de {days[selectedDay]}</span>
                  {selectedDay === realTodayIndex && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-accent text-slate-950">
                      Hoy
                    </span>
                  )}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Desliza lateralmente en el móvil para cambiar de día.
                </p>
              </div>
              <button
                onClick={() => setSelectedDay((prev) => (prev < 6 ? prev + 1 : 0))}
                aria-label="Día siguiente"
                className="p-2 rounded-xl bg-surface-2 text-text-muted hover:text-text hover:bg-surface border border-border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <span className="text-xs font-mono font-bold text-text-muted">
              {dayEvents.length} actividad(es)
            </span>
          </div>

          {/* Live "NOW" indicator for current day */}
          {selectedDay === realTodayIndex && (
            <div
              className="p-3 rounded-xl bg-accent-subtle border border-accent/30 flex items-center justify-between text-xs text-text shadow-xs"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-accent" />
                </span>
                <span className="font-bold text-accent">Línea de Tiempo en Vivo</span>
              </div>
              <span className="font-mono font-bold text-xs bg-surface px-2.5 py-1 rounded-lg border border-border">
                {formattedLiveTime}
              </span>
            </div>
          )}

          {/* Events Staggered List */}
          {dayEvents.length === 0 ? (
            <div className="py-16 text-center text-text-muted space-y-3">
              <Calendar className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-sm font-medium">
                No tienes compromisos registrados para este día con el filtro seleccionado.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-2 hover:bg-surface border border-border text-xs font-bold text-accent transition-colors min-h-[44px]"
              >
                <Plus className="w-4 h-4" /> Agregar primer evento
              </button>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {dayEvents.map((ev) => {
                const meta = getCategoryMeta(ev.category);
                const hasConflict = conflictEventIds.has(ev.id);
                const CategoryIcon = meta.icon;

                return (
                  <motion.div
                    key={ev.id}
                    variants={itemVariants}
                    className={`relative flex items-start sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border transition-all ${meta.accentBorder} border-l-4 ${
                      hasConflict
                        ? 'bg-warning-subtle border-warning/50 ring-1 ring-warning shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                        : 'bg-surface-2/80 hover:bg-surface-2 border-border hover:shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      {/* Time pill */}
                      <div className="font-mono text-xs font-bold text-accent bg-surface px-2.5 py-1.5 rounded-lg border border-border shrink-0 self-start sm:self-auto flex items-center gap-1.5 shadow-2xs">
                        <Clock className="w-3.5 h-3.5 text-text-muted" />
                        <span>
                          {ev.start} – {ev.end}
                        </span>
                        <span className="text-[10px] text-text-muted font-normal">
                          ({formatDuration(ev.start, ev.end)})
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${meta.badgeClass}`}
                          >
                            <CategoryIcon className="w-3 h-3" />
                            {meta.label}
                          </span>

                          {hasConflict && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-warning text-slate-950 inline-flex items-center gap-1 animate-pulse">
                              <AlertTriangle className="w-3 h-3" /> Solapamiento
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-text truncate">{ev.title}</h3>

                        {ev.notes && (
                          <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-accent" />
                            <span className="truncate">{ev.notes}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions: Google Cal, WhatsApp & Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToGoogleCalendar(ev);
                        }}
                        title={`Añadir "${ev.title}" a Google Calendar`}
                        aria-label={`Añadir "${ev.title}" a Google Calendar`}
                        className="p-2 text-text-muted hover:text-sky-400 rounded-xl hover:bg-surface border border-transparent hover:border-border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <Calendar className="w-4 h-4 text-sky-400" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendWhatsAppEvent(ev);
                        }}
                        title={`Enviar recordatorio de "${ev.title}" a WhatsApp`}
                        aria-label={`Enviar recordatorio de "${ev.title}" a WhatsApp`}
                        className="p-2 text-text-muted hover:text-emerald-400 rounded-xl hover:bg-surface border border-transparent hover:border-border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                      </button>

                      <button
                        onClick={() => onDeleteEvent(ev.id)}
                        title={`Eliminar evento: ${ev.title}`}
                        aria-label={`Eliminar evento: ${ev.title}`}
                        className="p-2 text-text-muted hover:text-danger rounded-xl hover:bg-surface border border-transparent hover:border-border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </section>

        {/* Free Windows & Prime Tips (Right Col on lg) */}
        <div className="space-y-6">
          {/* Free Slots Card with Subtle Glow */}
          <section
            aria-labelledby="free-slots-title"
            className="bg-surface border border-border p-5 rounded-2xl shadow-xs space-y-4"
          >
            <div>
              <h2
                id="free-slots-title"
                className="text-sm sm:text-base font-bold text-text flex items-center gap-2"
              >
                <Clock className="w-4 h-4 text-success" />
                Ventanas Libres Detectadas
              </h2>
              <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                Huecos disponibles en {days[selectedDay]} para programar Gym o trabajo en Outlier.
              </p>
            </div>

            {freeSlots.length === 0 ? (
              <div className="p-4 rounded-xl bg-surface-2 border border-border text-center text-xs text-text-muted">
                Agenda llena. No se detectaron huecos libres mayores a 40 minutos este día.
              </div>
            ) : (
              <div className="space-y-2.5">
                {freeSlots.map((slot, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-success-subtle/40 border border-success/30 hover:border-success/60 shadow-[0_0_15px_rgba(16,185,129,0.08)] flex items-center justify-between gap-3 transition-all"
                  >
                    <div>
                      <div className="font-mono text-xs font-black text-text flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-success" />
                        {slot.startStr} – {slot.endStr}
                      </div>
                      <span className="text-[11px] text-success font-bold mt-0.5 block">
                        {slot.duration} minutos libres
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setFormStart(slot.startStr);
                        setFormEnd(slot.endStr);
                        setFormTitle('GYM Sesión Prime / Outlier');
                        setFormCategory('gym');
                        setIsAddModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-2 border border-border text-accent text-xs font-bold transition-all min-h-[38px] active:scale-95 shadow-2xs"
                    >
                      + Aprovechar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Prime Schedule Intelligence Tips */}
          <section
            aria-label="Recomendaciones de horario"
            className="bg-surface border border-border p-5 rounded-2xl text-xs text-text-muted space-y-3 shadow-xs"
          >
            <h3 className="font-black text-text text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" /> Recomendaciones Prime
            </h3>
            <div className="space-y-2 leading-relaxed">
              <div className="p-2.5 rounded-xl bg-surface-2 border border-border">
                <p className="font-bold text-text">⚽ Jueves / Arbitraje COARC:</p>
                <p className="text-[11px] mt-0.5">
                  El entrenamiento físico de COARC (7:15 PM) choca con Práctica Empresarial. Considera rotar asistencias o programar la tesis temprano.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-2 border border-border">
                <p className="font-bold text-text">🏋️ Bloque de Gym:</p>
                <p className="text-[11px] mt-0.5">
                  60 minutos intensos bastan para sobrecarga progresiva sin restarle horas al Trabajo de Grado ni a las tareas de Outlier.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Accessible Add Event Modal */}
      {isAddModalOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-event-title"
            className="w-full max-w-md bg-surface border border-border p-5 sm:p-6 rounded-2xl shadow-2xl text-text max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <h2 id="add-event-title" className="text-base sm:text-lg font-black text-text">
                Agregar Compromiso ({days[selectedDay]})
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Cerrar ventana"
                className="p-1.5 rounded-xl text-text-muted hover:text-text hover:bg-surface-2 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="event-title-input" className="text-xs font-bold text-text block mb-1">
                  Nombre de la Actividad:
                </label>
                <input
                  id="event-title-input"
                  ref={titleInputRef}
                  type="text"
                  placeholder="Ej. Clase U, Tesis, Gym, Arbitraje..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border text-text text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                />
              </div>

              <div>
                <label htmlFor="event-category-select" className="text-xs font-bold text-text block mb-1">
                  Categoría:
                </label>
                <select
                  id="event-category-select"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border text-text text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <option value="university">Universidad / Clases</option>
                  <option value="thesis">Trabajo de Grado U (Tesis)</option>
                  <option value="outlier">Trabajo Outlier (3-4h)</option>
                  <option value="referee">Arbitraje COARC / Partido</option>
                  <option value="gym">Gym Prime (60m)</option>
                  <option value="family">Familia / Colegio / Terapias</option>
                  <option value="other">Otro / Descanso</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="event-start-time" className="text-xs font-bold text-text block mb-1">
                    Hora Inicio:
                  </label>
                  <input
                    id="event-start-time"
                    type="time"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-border text-text text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  />
                </div>
                <div>
                  <label htmlFor="event-end-time" className="text-xs font-bold text-text block mb-1">
                    Hora Fin:
                  </label>
                  <input
                    id="event-end-time"
                    type="time"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-border text-text text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="event-notes-input" className="text-xs font-bold text-text block mb-1">
                  Notas / Lugar / Salón (opcional):
                </label>
                <input
                  id="event-notes-input"
                  type="text"
                  placeholder="Ej. Salón 302, Cancha COARC, Asesoría..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border text-text text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-surface-2 hover:bg-surface text-text-muted hover:text-text text-xs font-bold transition-colors min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 text-xs font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[44px] shadow-xs"
                >
                  Guardar Compromiso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export to Google Calendar (.ics) Modal */}
      {isExportModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsExportModalOpen(false);
          }}
        >
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-text animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-surface-2/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent-subtle border border-accent/30 flex items-center justify-center text-accent">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="export-modal-title" className="text-base font-extrabold text-text">
                    Sincronizar con Google Calendar (.ics)
                  </h3>
                  <p className="text-xs text-text-muted">
                    Lleva tus clases, tesis, COARC y entrenamientos a tu celular.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                aria-label="Cerrar modal"
                className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-surface-2 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* Export Scope Selector */}
              <div>
                <label className="text-xs font-bold text-text block mb-2">
                  Selecciona qué deseas exportar:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setExportType('week')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      exportType === 'week'
                        ? 'bg-accent/10 border-accent text-accent shadow-xs'
                        : 'bg-surface-2 border-border text-text-muted hover:text-text'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase tracking-wide">Semana Completa</span>
                      {exportType === 'week' && <CheckCircle2 className="w-4 h-4 text-accent" />}
                    </div>
                    <p className="text-[11px] text-text-muted leading-tight">
                      Recurrente semanal (Lunes a Domingo con clases y arbitraje).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportType('day')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      exportType === 'day'
                        ? 'bg-accent/10 border-accent text-accent shadow-xs'
                        : 'bg-surface-2 border-border text-text-muted hover:text-text'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase tracking-wide">Solo {days[selectedDay]}</span>
                      {exportType === 'day' && <CheckCircle2 className="w-4 h-4 text-accent" />}
                    </div>
                    <p className="text-[11px] text-text-muted leading-tight">
                      Solo los compromisos de hoy {days[selectedDay]}.
                    </p>
                  </button>
                </div>
              </div>

              {/* Download & Direct Calendar Action */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleDownloadICS}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-black text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[48px] shadow-sm active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" />
                  Descargar archivo .ics ({exportType === 'week' ? 'Toda la semana' : days[selectedDay]})
                </button>

                <a
                  href="https://calendar.google.com/calendar/u/0/r/settings/export"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-2 hover:bg-surface border border-border text-text text-xs font-bold transition-colors min-h-[44px]"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-accent" />
                  Abrir Importador de Google Calendar en la Web
                </a>
              </div>

              {/* Live Subscription Feed Option */}
              <div className="p-3.5 rounded-xl bg-accent-subtle/40 border border-accent/30 space-y-2">
                <span className="font-bold text-accent text-xs flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Suscripción en Vivo Automática
                </span>
                <p className="text-[11px] text-text-muted">
                  Copia esta URL y agrégala en Google Calendar → <em>"Desde una URL"</em> para que tu celular sincronice los cambios automáticamente:
                </p>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== 'undefined' ? `${window.location.origin}/api/schedule/feed.ics` : '/api/schedule/feed.ics'}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-surface border border-border text-[11px] font-mono text-text focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/api/schedule/feed.ics`;
                      navigator.clipboard.writeText(url);
                      toast.success({
                        title: 'Enlace del Feed copiado',
                        message: 'Pégalo en Google Calendar en "Añadir desde una URL".'
                      });
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent text-slate-950 font-bold text-[11px] hover:bg-accent-hover transition-colors shrink-0"
                  >
                    <Copy className="w-3 h-3" /> Copiar
                  </button>
                </div>
              </div>

              {/* Instructions Pill */}
              <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border/70 text-xs space-y-2">
                <span className="font-bold text-text flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-accent" /> ¿Cómo agregarlo a tu celular?
                </span>
                <ul className="text-text-muted text-[11px] space-y-1.5 list-disc list-inside">
                  <li>
                    <strong className="text-text">Android:</strong> Descarga el archivo y dale tap en las notificaciones para abrirlo directamente con <strong className="text-text">Google Calendar</strong>.
                  </li>
                  <li>
                    <strong className="text-text">iPhone:</strong> Al descargar el archivo, ábrelo en la app <strong className="text-text">Archivos</strong> y selecciona <strong className="text-text">"Añadir todos"</strong> a tu Calendario.
                  </li>
                  <li>
                    <strong className="text-text">Google Calendar Web:</strong> Ve a Ajustes ⚙️ &gt; <em>Importar y exportar</em> &gt; Selecciona este archivo y quedará sincronizado con tu cuenta de Google.
                  </li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-4 border-t border-border bg-surface-2/20">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-surface-2 hover:bg-surface text-text text-xs font-bold transition-colors min-h-[38px]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
