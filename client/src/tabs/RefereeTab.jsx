import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  Sparkles,
  Award,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Eye,
  Filter,
  Zap,
  Target,
  FileText,
  ExternalLink,
  Info,
  Check,
  CheckCheck,
  Clock,
  ArrowRight,
  Layers
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { haptics } from '../utils/haptics';
import { useToast } from '../context/ToastContext';
import { IFAB_LAWS_DATA } from '../data/rulesData';
import { rulesApi } from '../services/rulesApi';

// ─── BANCO DE CASOS PRÁCTICOS & SIMULADOR DE JUICIO ARBITRAL ────────────
const REFEREE_CASES = [
  {
    id: 'case-1',
    category: 'Regla 11 · Fuera de Juego',
    title: 'Despeje fallido del defensor con delantero adelantado',
    situation: 'Un delantero se encuentra en posición de fuera de juego cuando su compañero filtra un balón largo. Un defensor retrocede con visión clara, mide el balón y salta para rechazar de cabeza, pero roza levemente el balón y este le cae al delantero adelantado, quien anota.',
    question: '¿Cuál es la decisión reglamentaria correcta según la circular IFAB?',
    options: [
      { text: 'Conceder el gol. El defensor realizó una acción deliberada de jugar el balón y por tanto habilitó al delantero.', isCorrect: true },
      { text: 'Anular el gol por fuera de juego. El defensor no controló el balón, fue solo un toque defectuoso.', isCorrect: false },
      { text: 'Balón a tierra con el arquero por interferencia en la trayectoria.', isCorrect: false },
      { text: 'Anular el gol y amonestar al delantero por actitud antideportiva.', isCorrect: false }
    ],
    explanation: 'Según la aclaración oficial de la IFAB sobre "juego deliberado", cuando un defensor intenta jugar el balón teniendo visión clara, tiempo para coordinar su movimiento y no siendo un disparo violento e imprevisto, se considera acción deliberada aunque el contacto sea defectuoso. Por tanto, HABILITA al atacante.'
  },
  {
    id: 'case-2',
    category: 'Regla 12 · DOGSO en el Área Penal',
    title: 'Doble castigo: Sujeción en ocasión manifiesta de gol',
    situation: 'Un delantero escapa solo frente al guardameta rival dentro del área penal. Un defensor que corre detrás de él, al verse superado y sin opción de jugar el balón, lo sujeta fuertemente de la camiseta derribándolo antes de que pueda rematar.',
    question: '¿Qué sanción técnica y disciplinaria debes aplicar?',
    options: [
      { text: 'Tiro penal + Tarjeta Amarilla (desdoble por ocurrir dentro del área).', isCorrect: false },
      { text: 'Tiro penal + Tarjeta Roja directa (DOGSO sin disputa de balón).', isCorrect: true },
      { text: 'Tiro libre indirecto + Tarjeta Amarilla por sujeción táctica.', isCorrect: false },
      { text: 'Tiro penal sin tarjeta disciplinaria.', isCorrect: false }
    ],
    explanation: 'La regla de eliminación del "doble castigo" (degradar de roja a amarilla) solo aplica si la falta dentro del área penal fue disputando el balón o con intención de jugarlo. Al ser una SUJECIÓN, jaloneo o empujón sin opción de balón, se mantiene la TARJETA ROJA DIRECTA por DOGSO + Tiro Penal.'
  },
  {
    id: 'case-3',
    category: 'Regla 12 · Manos',
    title: 'Rebote del propio cuerpo hacia el brazo',
    situation: 'Un defensor salta a cabecear un centro rival. Impacta el balón limpiamente con su cabeza, pero el balón desciende y pega inmediatamente en su brazo que estaba semiabierto por el impulso natural del salto.',
    question: '¿Cómo debes sancionar la jugada?',
    options: [
      { text: 'No es infracción (juega). El balón proviene directamente de su propia cabeza tras un contacto deliberado y el brazo está justificado por el salto.', isCorrect: true },
      { text: 'Tiro penal inmediato. Toda mano separada del cuerpo se sanciona sin excepción.', isCorrect: false },
      { text: 'Tiro libre indirecto por mano involuntaria peligrosa.', isCorrect: false },
      { text: 'Balón a tierra para reiniciar la acción.', isCorrect: false }
    ],
    explanation: 'No es infracción cuando el balón proviene directamente de la cabeza o cuerpo del propio jugador tras un despeje voluntario, siempre y cuando la posición de los brazos sea una consecuencia natural y biomecánicamente justificada del movimiento o salto del cuerpo.'
  },
  {
    id: 'case-4',
    category: 'Regla 14 · Tiro Penal',
    title: 'Finta ilegal al finalizar la carrera',
    situation: 'El ejecutor de un tiro penal inicia su carrera, frena un instante en el recorrido (permitido), pero al llegar a la pelota finge patear con el pie derecho, engaña completamente al arquero que se lanza a un lado, y luego empuja el balón a la red.',
    question: '¿Qué decisión debe tomar el árbitro?',
    options: [
      { text: 'Gol válido porque las fintas están autorizadas.', isCorrect: false },
      { text: 'Se repite el tiro penal y se advierte verbalmente al ejecutor.', isCorrect: false },
      { text: 'Anular el gol, Tiro Libre Indirecto para la defensa + Tarjeta Amarilla al ejecutor.', isCorrect: true },
      { text: 'Balón a tierra en el punto penal.', isCorrect: false }
    ],
    explanation: 'Hacer una finta para engañar al guardameta una vez completada la carrera hacia el balón se considera una conducta antideportiva explícita (Regla 14). El gol se anula, se reanuda con Tiro Libre Indirecto para el adversario y se amonesta con Tarjeta Amarilla al ejecutor.'
  },
  {
    id: 'case-5',
    category: 'Regla 12 · Faltas Graves',
    title: 'Plancha con fuerza excesiva en disputa de balón',
    situation: 'Dos jugadores disputan un balón dividido. Uno de ellos llega antes, pero el rival entra con la pierna completamente estirada, tacos hacia adelante a la altura de la espinilla del adversario, impactándolo con velocidad e intensidad extrema.',
    question: '¿Cuál es la tipificación técnica y sanción disciplinaria?',
    options: [
      { text: 'Falta temeraria: Tiro libre directo + Tarjeta Amarilla.', isCorrect: false },
      { text: 'Juego Brusco Grave (Fuerza Excesiva): Tiro libre directo + Tarjeta Roja directa.', isCorrect: true },
      { text: 'Falta imprudente: Tiro libre directo sin tarjeta.', isCorrect: false },
      { text: 'Conducta violenta: Balón a tierra + Tarjeta Roja.', isCorrect: false }
    ],
    explanation: 'Tacos por delante a la altura de la canilla con pierna extendida y velocidad pone en peligro inminente la integridad física del adversario. La IFAB tipifica esto como Juego Brusco Grave (Fuerza Excesiva), cuya sanción obligatoria es Tarjeta Roja directa.'
  },
  {
    id: 'case-6',
    category: 'Regla 11 · Fuera de Juego',
    title: 'Interferir en el adversario tapando la visión del guardameta',
    situation: 'Un delantero en posición de fuera de juego se encuentra parado a 2 metros del arquero, directamente en su línea visual. Un compañero del delantero dispara desde fuera del área y el balón entra al arco sin que el delantero en offside toque la pelota.',
    question: '¿Qué debe sancionar el árbitro?',
    options: [
      { text: 'Gol válido porque el delantero nunca tocó el balón.', isCorrect: false },
      { text: 'Anular el gol por Fuera de Juego: interfirió en el adversario al obstruir claramente su campo visual.', isCorrect: true },
      { text: 'Balón a tierra con el guardameta.', isCorrect: false },
      { text: 'Se repite la jugada desde fuera del área.', isCorrect: false }
    ],
    explanation: 'La Regla 11 sanciona el fuera de juego cuando un atacante en posición adelantada "interfiere en un adversario", lo cual incluye explícitamente impedir que juegue o pueda jugar el balón al obstruir claramente su campo visual.'
  },
  {
    id: 'case-7',
    category: 'Regla 8 · Balón a Tierra',
    title: 'Balón golpea al árbitro y cambia de dueño',
    situation: 'El equipo blanco tiene el balón en la mitad de la cancha armando un contragolpe. El pase choca contra la espalda del árbitro central y el rebote le queda directamente al delantero del equipo azul, que queda con opción de ataque.',
    question: '¿Cómo debe actuar el árbitro?',
    options: [
      { text: 'Dejar seguir. El árbitro es considerado "aire" o parte del campo.', isCorrect: false },
      { text: 'Detener el juego inmediatamente y conceder un Balón a Tierra para el equipo blanco.', isCorrect: true },
      { text: 'Pitar falta en contra del jugador que pateó el balón hacia el árbitro.', isCorrect: false },
      { text: 'Conceder saque de banda para el equipo blanco.', isCorrect: false }
    ],
    explanation: 'Desde la modificación de la IFAB a la Regla 8, el árbitro ya NO es "aire". Si el balón toca al árbitro y cambia la posesión de equipo, o inicia un ataque prometedor, o entra a gol, se DEBE detener el juego y dar balón a tierra al equipo que tenía la posesión en el punto del impacto.'
  },
  {
    id: 'case-8',
    category: 'Regla 12 · SPA vs Ventaja',
    title: 'Ataque prometedor con ventaja que termina en gol',
    situation: 'Un mediocampista sujeta de la camiseta a un rival para cortar un ataque prometedor (SPA). El árbitro aplica la ley de la ventaja porque el balón le queda a un compañero que avanza y remata anotando gol.',
    question: '¿Debe el árbitro amonestar al infractor con tarjeta amarilla tras el gol?',
    options: [
      { text: 'Sí, toda falta táctica se amonesta obligatoriamente tras la ventaja.', isCorrect: false },
      { text: 'No. Al haberse concretado el ataque prometedor con el gol, desaparece la justificación de la tarjeta amarilla por SPA.', isCorrect: true },
      { text: 'Debe expulsarlo con tarjeta roja.', isCorrect: false },
      { text: 'Depende de si el capitán rival lo solicita.', isCorrect: false }
    ],
    explanation: 'Si el árbitro concede ventaja tras una infracción que evitaba un ataque prometedor (SPA) y la jugada culmina directamente en gol, NO se muestra tarjeta amarilla por SPA porque el objetivo de la infracción (frustrar el ataque) no se consumó. Solo se amonestaría si la falta hubiese sido temeraria.'
  }
];

// Helper de estados de estudio
const STUDY_STATUS_CONFIG = {
  no_vista: {
    label: 'No vista',
    badgeClass: 'bg-surface-2 text-text-muted border-border',
    icon: Clock,
    color: 'text-text-muted'
  },
  vista: {
    label: 'Vista',
    badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    icon: Eye,
    color: 'text-sky-400'
  },
  practicada: {
    label: 'Practicada',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    icon: Zap,
    color: 'text-amber-400'
  },
  dominada: {
    label: 'Dominada',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: CheckCheck,
    color: 'text-emerald-400'
  }
};

export default function RefereeTab() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('laws'); // 'laws' | 'cases' | 'cheatsheet' | 'flashcards'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLawIndex, setSelectedLawIndex] = useState(10); // Regla 11 (índice 10) por defecto
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [studyProgress, setStudyProgress] = useState({});
  const [mobileViewMode, setMobileViewMode] = useState('list'); // 'list' | 'detail' en pantallas pequeñas

  // Secciones colapsables de los 3 niveles
  const [expandedLevels, setExpandedLevels] = useState({
    level1: true,
    level2: true,
    level3: true,
    table: true
  });

  // Simulator Quiz state
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);

  // Flashcards state
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Cargar progreso del backend al montar
  useEffect(() => {
    let isMounted = true;
    rulesApi.getProgress().then((progress) => {
      if (isMounted && progress) {
        setStudyProgress(progress);
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Regla actual seleccionada
  const selectedLaw = IFAB_LAWS_DATA[selectedLawIndex] || IFAB_LAWS_DATA[0];

  // Filtro de reglas
  const filteredLaws = useMemo(() => {
    return IFAB_LAWS_DATA.filter((law) => {
      const matchesCat = categoryFilter === 'all' || law.category === categoryFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        law.number.toString() === q ||
        law.title.toLowerCase().includes(q) ||
        law.level1.summary.toLowerCase().includes(q) ||
        law.practicalCriteria.toLowerCase().includes(q) ||
        (law.noveltyText && law.noveltyText.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [categoryFilter, searchQuery]);

  // Métricas de estudio
  const progressStats = useMemo(() => {
    let vistas = 0;
    let practicadas = 0;
    let dominadas = 0;

    for (let i = 1; i <= 17; i++) {
      const st = studyProgress[i]?.status || (i === 11 ? 'vista' : 'no_vista');
      if (st === 'vista') vistas++;
      else if (st === 'practicada') practicadas++;
      else if (st === 'dominada') dominadas++;
    }

    const totalEstudiadas = vistas + practicadas + dominadas;
    const pct = Math.round((totalEstudiadas / 17) * 100);

    return { totalEstudiadas, vistas, practicadas, dominadas, pct };
  }, [studyProgress]);

  // Manejador para marcar estado de la regla
  const handleSetRuleStatus = async (lawNumber, newStatus) => {
    sounds.playToastChime();
    haptics.impactLight();

    const updated = await rulesApi.updateProgress(lawNumber, newStatus);
    setStudyProgress({ ...updated });

    const statusLabel = STUDY_STATUS_CONFIG[newStatus]?.label || newStatus;
    toast.success({
      title: `Regla ${lawNumber} actualizada`,
      message: `Marcada como: "${statusLabel}". Progreso guardado.`
    });
  };

  // Alternar siguiente estado de estudio
  const handleToggleStudyStatus = async (lawNumber) => {
    const current = studyProgress[lawNumber]?.status || (lawNumber === 11 ? 'vista' : 'no_vista');
    const order = ['no_vista', 'vista', 'practicada', 'dominada'];
    const nextIdx = (order.indexOf(current) + 1) % order.length;
    const nextStatus = order[nextIdx];
    await handleSetRuleStatus(lawNumber, nextStatus);
  };

  // Navegación entre reglas
  const handlePrevLaw = () => {
    sounds.playToastChime();
    haptics.impactLight();
    setSelectedLawIndex((prev) => (prev > 0 ? prev - 1 : IFAB_LAWS_DATA.length - 1));
  };

  const handleNextLaw = () => {
    sounds.playToastChime();
    haptics.impactLight();
    setSelectedLawIndex((prev) => (prev < IFAB_LAWS_DATA.length - 1 ? prev + 1 : 0));
  };

  // Toggle de nivel colapsable
  const toggleLevel = (levelKey) => {
    setExpandedLevels(prev => ({ ...prev, [levelKey]: !prev[levelKey] }));
    haptics.impactLight();
  };

  // Quiz Simulator
  const currentCase = REFEREE_CASES[currentCaseIndex];

  const handleSelectOption = (idx) => {
    if (hasAnswered) return;
    setSelectedOption(idx);
    setHasAnswered(true);
    setTotalAnswered(prev => prev + 1);

    const isCorrect = currentCase.options[idx].isCorrect;
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
      sounds.playSuccessChime();
      haptics.seriesDone();
      toast.success({
        title: '¡Decisión Arbitral Correcta!',
        message: 'Has aplicado con precisión el criterio IFAB.'
      });
    } else {
      sounds.playAlarmBeep();
      haptics.alarmVibration();
      toast.error({
        title: 'Criterio Incorrecto',
        message: 'Revisa la fundamentación reglamentaria de la jugada.'
      });
    }
  };

  const handleNextCase = () => {
    setSelectedOption(null);
    setHasAnswered(false);
    setCurrentCaseIndex((prev) => (prev + 1) % REFEREE_CASES.length);
  };

  const handleResetQuiz = () => {
    setCurrentCaseIndex(0);
    setSelectedOption(null);
    setHasAnswered(false);
    setQuizScore(0);
    setTotalAnswered(0);
    toast.info({
      title: 'Simulador reiniciado',
      message: 'Comienza una nueva serie de jugadas polémicas.'
    });
  };

  // Estado actual de la regla en estudio
  const currentLawStatus = studyProgress[selectedLaw.number]?.status || (selectedLaw.number === 11 ? 'vista' : 'no_vista');
  const currentStatusConfig = STUDY_STATUS_CONFIG[currentLawStatus] || STUDY_STATUS_CONFIG.no_vista;
  const StatusIcon = currentStatusConfig.icon;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─── TAB HEADER BANNER ───────────────────────────────────────── */}
      <section className="bg-surface border border-border p-5 sm:p-6 rounded-2xl shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-accent-subtle border border-accent/30 flex items-center justify-center text-accent shadow-xs shrink-0 mt-0.5 sm:mt-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-text tracking-tight">
                  Resumen de estudio · Reglas de Juego 2026/27
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/30">
                  Estudio Activo
                </span>
              </div>
              <p className="text-xs sm:text-sm text-text-muted mt-0.5">
                Herramienta de estudio del reglamento arbitral: análisis estructurado, criterios prácticos y seguimiento de dominio.
              </p>
            </div>
          </div>

          {/* Quick Study Progress Indicator */}
          <div className="bg-surface-2 px-4 py-2.5 rounded-xl border border-border self-start lg:self-auto shadow-2xs min-w-[210px]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-text-muted font-medium text-[11px]">Progreso de estudio:</span>
              <span className="font-mono font-black text-text">
                {progressStats.totalEstudiadas}/17 ({progressStats.pct}%)
              </span>
            </div>
            <div className="w-full bg-surface rounded-full h-2 overflow-hidden border border-border/40">
              <div
                className="bg-accent h-2 transition-all duration-300 rounded-full"
                style={{ width: `${progressStats.pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-text-muted mt-1.5 font-medium">
              <span>{progressStats.vistas} Vistas</span>
              <span>{progressStats.practicadas} Practicadas</span>
              <span className="text-emerald-500 font-bold">{progressStats.dominadas} Dominadas</span>
            </div>
          </div>
        </div>

        {/* Fixed Non-Official Material Disclaimer Banner */}
        <div className="mt-4 pt-3 border-t border-border flex items-start gap-2.5 text-xs text-text-muted bg-surface-2/60 p-3 rounded-xl border border-border/80">
          <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong className="text-text font-bold">Aviso importante:</strong> Material de estudio no oficial; ante dudas o discrepancias de interpretación prevalece siempre el texto oficial de las Reglas de Juego emitido por la IFAB en inglés.
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 mt-4 border-t border-border no-scrollbar">
          <button
            onClick={() => setActiveSection('laws')}
            className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeSection === 'laws'
                ? 'bg-accent text-slate-950 font-black shadow-xs'
                : 'bg-surface-2 text-text-muted hover:text-text hover:bg-surface border border-border'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Las 17 Reglas IFAB
          </button>

          <button
            onClick={() => setActiveSection('cases')}
            className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeSection === 'cases'
                ? 'bg-accent text-slate-950 font-black shadow-xs'
                : 'bg-surface-2 text-text-muted hover:text-text hover:bg-surface border border-border'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Simulador de Juicio Arbitral
          </button>

          <button
            onClick={() => setActiveSection('cheatsheet')}
            className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeSection === 'cheatsheet'
                ? 'bg-accent text-slate-950 font-black shadow-xs'
                : 'bg-surface-2 text-text-muted hover:text-text hover:bg-surface border border-border'
            }`}
          >
            <Target className="w-4 h-4" />
            Criterios Clave
          </button>

          <button
            onClick={() => setActiveSection('flashcards')}
            className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeSection === 'flashcards'
                ? 'bg-accent text-slate-950 font-black shadow-xs'
                : 'bg-surface-2 text-text-muted hover:text-text hover:bg-surface border border-border'
            }`}
          >
            <Zap className="w-4 h-4" />
            Flashcards Pre-Partido
          </button>
        </div>
      </section>

      {/* ─── SECTION 1: LAS 17 REGLAS (ESTUDIO ACTIVO) ───────────────── */}
      {activeSection === 'laws' && (
        <div>
          {/* Mobile Back Button when in Detail View on small screens */}
          <div className="lg:hidden mb-4">
            {mobileViewMode === 'detail' ? (
              <button
                onClick={() => setMobileViewMode('list')}
                className="min-h-[44px] w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-surface-2 hover:bg-surface border border-border text-xs font-bold text-text shadow-2xs transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-accent" />
                Volver a la lista de las 17 reglas
              </button>
            ) : (
              <div className="text-xs text-text-muted mb-2 px-1">
                Selecciona una regla para acceder al estudio detallado en 3 niveles.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ── Left Column: Law List & Filter ──────────────────────── */}
            <div className={`lg:col-span-5 space-y-3 ${mobileViewMode === 'detail' ? 'hidden lg:block' : 'block'}`}>
              {/* Search & Category Filter */}
              <div className="space-y-2 bg-surface p-3.5 rounded-2xl border border-border shadow-xs">
                <div className="relative">
                  <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="Buscar regla, palabra clave (fuera de juego, manos, joyas)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="min-h-[44px] w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-surface-2 border border-border text-text text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shadow-2xs"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                  {[
                    { id: 'all', label: 'Todas (17)' },
                    { id: 'structure', label: 'Estructura (1-4)' },
                    { id: 'game', label: 'Juego (5-10)' },
                    { id: 'fouls', label: 'Faltas y Offside (11-12)' },
                    { id: 'restarts', label: 'Reanudaciones (13-17)' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryFilter(cat.id)}
                      className={`min-h-[36px] px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap border transition-all ${
                        categoryFilter === cat.id
                          ? 'bg-accent/15 text-accent border-accent/40 shadow-2xs'
                          : 'bg-surface-2 text-text-muted border-border hover:text-text'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* List of Laws */}
              <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
                {filteredLaws.map((law) => {
                  const isSelected = selectedLaw.number === law.number;
                  const lawIndex = IFAB_LAWS_DATA.findIndex(l => l.number === law.number);
                  const lawStatus = studyProgress[law.number]?.status || (law.number === 11 ? 'vista' : 'no_vista');
                  const statusCfg = STUDY_STATUS_CONFIG[lawStatus] || STUDY_STATUS_CONFIG.no_vista;
                  const LawStatusIcon = statusCfg.icon;

                  return (
                    <button
                      key={law.number}
                      onClick={() => {
                        setSelectedLawIndex(lawIndex);
                        setMobileViewMode('detail');
                        sounds.playToastChime();
                        haptics.impactLight();
                      }}
                      className={`min-h-[64px] w-full flex items-start justify-between p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-accent/10 border-accent shadow-xs ring-1 ring-accent/30'
                          : 'bg-surface border-border hover:bg-surface-2 hover:border-border-subtle'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Number Box */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${
                          isSelected ? 'bg-accent text-slate-950' : 'bg-surface-2 text-text-muted border border-border'
                        }`}>
                          {law.number}
                        </div>

                        {/* Title and Summary */}
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-text truncate">
                              Regla {law.number}: {law.title}
                            </span>
                            {law.hasNovelty2026 && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30 shrink-0">
                                Novedad
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-text-muted line-clamp-1">
                            {law.level1.summary}
                          </p>

                          {/* Chips: Audit Status & Study Status */}
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusCfg.badgeClass}`}>
                              <LawStatusIcon className="w-2.5 h-2.5" />
                              {statusCfg.label}
                            </span>

                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                              law.auditStatus.includes('Verificada')
                                ? 'text-emerald-500 bg-emerald-500/10'
                                : 'text-amber-500 bg-amber-500/10'
                            }`}>
                              {law.auditStatus}
                            </span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className={`w-4 h-4 shrink-0 transition-transform mt-2 ${
                        isSelected ? 'text-accent translate-x-1' : 'text-text-muted'
                      }`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Right Column: Law Detail View ─────────────────────── */}
            <div className={`lg:col-span-7 ${mobileViewMode === 'list' ? 'hidden lg:block' : 'block'}`}>
              <div className="bg-surface border border-border rounded-2xl p-5 sm:p-7 shadow-xs space-y-6">
                {/* Header: Title, Official Link & Badges */}
                <div className="border-b border-border pb-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-accent text-slate-950 font-black text-xl flex items-center justify-center shadow-xs shrink-0">
                        {selectedLaw.number}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            selectedLaw.auditStatus.includes('Verificada')
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          }`}>
                            {selectedLaw.auditStatus}
                          </span>

                          {selectedLaw.hasNovelty2026 && (
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Novedad 2026/27
                            </span>
                          )}
                        </div>

                        <h2 className="text-xl sm:text-2xl font-black text-text mt-1">
                          Regla {selectedLaw.number}: {selectedLaw.title}
                        </h2>
                      </div>
                    </div>

                    {/* Official Text External Link */}
                    <a
                      href={selectedLaw.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-2 hover:bg-surface border border-border text-xs font-bold text-text hover:text-accent transition-colors self-start shadow-2xs"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-accent" />
                      <span>Ver texto oficial</span>
                      <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
                    </a>
                  </div>

                  {/* Study Status Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 bg-surface-2/60 p-3 rounded-xl border border-border">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-text-muted font-medium">Estado actual:</span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${currentStatusConfig.badgeClass}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {currentStatusConfig.label}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleStudyStatus(selectedLaw.number)}
                      className="min-h-[44px] flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-slate-950 hover:opacity-95 font-black text-xs transition-transform active:scale-95 shadow-xs"
                    >
                      <Check className="w-4 h-4" />
                      <span>Marcar como estudiada</span>
                    </button>
                  </div>
                </div>

                {/* Callout if Law has NeedsVerification (e.g. Rule 4) */}
                {selectedLaw.needsVerification && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      TODO: Verificar contra el PDF oficial 2026/27
                    </div>
                    <p className="text-xs text-amber-300/90 leading-relaxed">
                      {selectedLaw.verificationNotes}
                    </p>
                  </div>
                )}

                {/* Novelty description if present */}
                {selectedLaw.hasNovelty2026 && selectedLaw.noveltyText && (
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-1.5">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 shrink-0" />
                      Alineación y Novedad 2026/27
                    </div>
                    <p className="text-xs text-purple-300/90 leading-relaxed">
                      {selectedLaw.noveltyText}
                    </p>
                  </div>
                )}

                {/* ─── LEVEL 1: ESENCIAL (30 s) ────────────────────────── */}
                <div className="border border-border rounded-xl overflow-hidden bg-surface-2/40">
                  <button
                    onClick={() => toggleLevel('level1')}
                    className="min-h-[48px] w-full p-4 flex items-center justify-between bg-surface-2/80 hover:bg-surface-2 text-left font-bold text-sm text-text transition-colors border-b border-border/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-accent/20 text-accent flex items-center justify-center text-xs font-black">
                        1
                      </div>
                      <span className="font-extrabold text-text">Nivel 1: {selectedLaw.level1.title}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${expandedLevels.level1 ? 'rotate-180' : ''}`} />
                  </button>

                  {expandedLevels.level1 && (
                    <div className="p-4 sm:p-5 space-y-4 text-[15px] sm:text-base leading-relaxed text-text">
                      <div className="p-3.5 rounded-xl bg-surface border border-border text-[15px] leading-relaxed">
                        <span className="font-bold text-accent block mb-1 text-xs uppercase tracking-wider">Concepto Matriz:</span>
                        {selectedLaw.level1.summary}
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-text-muted">Puntos Esenciales:</h4>
                        <ul className="space-y-2 text-xs sm:text-[14px]">
                          {selectedLaw.level1.corePoints.map((pt, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 bg-surface/70 p-3 rounded-lg border border-border/80">
                              <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                              <span className="text-text">{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── LEVEL 2: DETALLE NORMATIVO ──────────────────────── */}
                <div className="border border-border rounded-xl overflow-hidden bg-surface-2/40">
                  <button
                    onClick={() => toggleLevel('level2')}
                    className="min-h-[48px] w-full p-4 flex items-center justify-between bg-surface-2/80 hover:bg-surface-2 text-left font-bold text-sm text-text transition-colors border-b border-border/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-accent/20 text-accent flex items-center justify-center text-xs font-black">
                        2
                      </div>
                      <span className="font-extrabold text-text">Nivel 2: {selectedLaw.level2.title}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${expandedLevels.level2 ? 'rotate-180' : ''}`} />
                  </button>

                  {expandedLevels.level2 && (
                    <div className="p-4 sm:p-5 space-y-4 text-[15px] sm:text-base leading-relaxed text-text">
                      {selectedLaw.level2.sections.map((sec, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-surface border border-border space-y-1.5">
                          <h4 className="font-black text-text text-sm sm:text-[15px] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                            {sec.subtitle}
                          </h4>
                          <p className="text-text-muted text-[15px] leading-relaxed">
                            {sec.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ─── LEVEL 3: EXCEPCIONES Y CASOS LÍMITE ────────────── */}
                <div className="border border-border rounded-xl overflow-hidden bg-surface-2/40">
                  <button
                    onClick={() => toggleLevel('level3')}
                    className="min-h-[48px] w-full p-4 flex items-center justify-between bg-surface-2/80 hover:bg-surface-2 text-left font-bold text-sm text-text transition-colors border-b border-border/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-accent/20 text-accent flex items-center justify-center text-xs font-black">
                        3
                      </div>
                      <span className="font-extrabold text-text">Nivel 3: {selectedLaw.level3.title}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${expandedLevels.level3 ? 'rotate-180' : ''}`} />
                  </button>

                  {expandedLevels.level3 && (
                    <div className="p-4 sm:p-5 space-y-3">
                      {selectedLaw.level3.cases.map((c, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-surface border border-border/90 space-y-1.5">
                          <h5 className="font-black text-text text-xs sm:text-sm flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            {c.caseTitle}
                          </h5>
                          <p className="text-text-muted text-xs sm:text-[14px] leading-relaxed">
                            {c.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ─── TABLA: INFRACCIÓN → REANUDACIÓN → SANCIÓN ──────── */}
                <div className="border border-border rounded-xl overflow-hidden bg-surface-2/40">
                  <button
                    onClick={() => toggleLevel('table')}
                    className="min-h-[48px] w-full p-4 flex items-center justify-between bg-surface-2/80 hover:bg-surface-2 text-left font-bold text-sm text-text transition-colors border-b border-border/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-accent" />
                      <span className="font-extrabold text-text">Tabla Técnica: Infracción → Reanudación → Sanción</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${expandedLevels.table ? 'rotate-180' : ''}`} />
                  </button>

                  {expandedLevels.table && (
                    <div className="p-4 sm:p-5 overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[500px]">
                        <thead>
                          <tr className="border-b border-border text-text-muted uppercase text-[10px] tracking-wider font-bold">
                            <th className="py-2.5 px-3">Infracción en el juego</th>
                            <th className="py-2.5 px-3">Reanudación técnica</th>
                            <th className="py-2.5 px-3">Sanción disciplinaria</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {selectedLaw.table.map((row, idx) => (
                            <tr key={idx} className="hover:bg-surface-2/50 transition-colors">
                              <td className="py-3 px-3 font-medium text-text align-top">{row.infraction}</td>
                              <td className="py-3 px-3 text-accent font-semibold align-top">{row.restart}</td>
                              <td className="py-3 px-3 text-text-muted align-top">{row.sanction}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* ─── CRITERIO PRÁCTICO EN CANCHA ────────────────────── */}
                <div className="p-4 sm:p-5 rounded-xl bg-accent-subtle border border-accent/30 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-black text-accent uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    Criterio práctico en cancha
                  </div>
                  <p className="text-xs sm:text-[14px] text-text leading-relaxed">
                    {selectedLaw.practicalCriteria}
                  </p>
                </div>

                {/* ─── NAVIGATION FOOTER (ANTERIOR / SIGUIENTE) ───────── */}
                <div className="flex items-center justify-between pt-4 border-t border-border gap-3">
                  <button
                    onClick={handlePrevLaw}
                    className="min-h-[44px] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-2 hover:bg-surface border border-border text-xs font-bold text-text transition-colors shadow-2xs"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Regla anterior</span>
                  </button>

                  <span className="text-xs font-mono text-text-muted font-bold">
                    {selectedLaw.number} / 17
                  </span>

                  <button
                    onClick={handleNextLaw}
                    className="min-h-[44px] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:opacity-95 text-slate-950 font-black text-xs transition-colors shadow-xs"
                  >
                    <span>Regla siguiente</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SECTION 2: SIMULADOR DE JUICIO ARBITRAL (QUIZ) ─────────── */}
      {activeSection === 'cases' && (
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="bg-surface border border-border p-5 sm:p-7 rounded-2xl shadow-xs space-y-5">
            {/* Case Progress Bar */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-accent flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" /> Caso {currentCaseIndex + 1} de {REFEREE_CASES.length}
              </span>
              <span className="text-text-muted text-[11px] font-mono">
                {currentCase.category}
              </span>
            </div>

            <div className="w-full bg-surface-2 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-accent h-1.5 transition-all duration-300 rounded-full"
                style={{ width: `${((currentCaseIndex + 1) / REFEREE_CASES.length) * 100}%` }}
              />
            </div>

            {/* Situation Card */}
            <div className="space-y-3">
              <h2 className="text-lg sm:text-xl font-black text-text">
                {currentCase.title}
              </h2>

              <div className="p-4 rounded-xl bg-surface-2 border border-border text-xs sm:text-sm text-text leading-relaxed">
                <span className="font-bold text-text-muted block text-xs mb-1 uppercase tracking-wider">
                  Situación en el campo:
                </span>
                {currentCase.situation}
              </div>

              <p className="text-xs sm:text-sm font-bold text-accent pt-1">
                ❓ {currentCase.question}
              </p>
            </div>

            {/* Multiple Choice Options */}
            <div className="space-y-2.5 pt-2">
              {currentCase.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                let btnStyle = 'bg-surface border-border hover:bg-surface-2 hover:border-accent/50 text-text';

                if (hasAnswered) {
                  if (opt.isCorrect) {
                    btnStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-400 font-bold ring-1 ring-emerald-500';
                  } else if (isSelected && !opt.isCorrect) {
                    btnStyle = 'bg-red-500/15 border-red-500 text-red-400 font-bold ring-1 ring-red-500';
                  } else {
                    btnStyle = 'bg-surface/50 border-border/50 text-text-muted opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={hasAnswered}
                    className={`min-h-[48px] w-full p-3.5 sm:p-4 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-start justify-between gap-3 ${btnStyle}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-lg bg-surface-2 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt.text}</span>
                    </div>

                    {hasAnswered && opt.isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    {hasAnswered && isSelected && !opt.isCorrect && (
                      <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Feedback & Technical Explanation */}
            <AnimatePresence>
              {hasAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-surface-2 border border-border space-y-2 mt-4"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-accent" />
                    <span className="text-xs font-black uppercase text-accent tracking-wider">
                      Fundamentación Reglamentaria IFAB:
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-text leading-relaxed">
                    {currentCase.explanation}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                onClick={handleResetQuiz}
                className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reiniciar Test
              </button>

              {hasAnswered && (
                <button
                  onClick={handleNextCase}
                  className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:opacity-95 text-slate-950 font-black text-xs transition-colors shadow-xs"
                >
                  Siguiente Jugada
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── SECTION 3: CRITERIOS CLAVE (CHULETA DE CAMPO) ──────────── */}
      {activeSection === 'cheatsheet' && (
        <div className="space-y-6">
          {/* Card 1: DOGSO vs SPA */}
          <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-text">
                  Matriz DOGSO vs SPA (Faltas Tácticas y Disciplina)
                </h3>
                <p className="text-xs text-text-muted">
                  Diferencia exacta entre Ocasión Manifiesta de Gol (DOGSO) y Detener Ataque Prometedor (SPA).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-red-400 text-sm">DOGSO (Ocasión Manifiesta de Gol)</span>
                  <span className="px-2 py-0.5 rounded font-black text-[10px] bg-red-500 text-slate-950">ROJA DIRECTA 🟥</span>
                </div>
                <p className="text-text-muted">Deben cumplirse los 4 factores ("Las 4 D"):</p>
                <ul className="list-disc list-inside space-y-1 text-text">
                  <li><strong>Distancia:</strong> Cerca al arco rival.</li>
                  <li><strong>Dirección:</strong> Con trayectoria directa hacia la portería.</li>
                  <li><strong>Disposición/Control:</strong> Posibilidad real de rematar o controlar el balón.</li>
                  <li><strong>Defensores:</strong> No hay defensores rivales que puedan interceptar antes del remate.</li>
                </ul>
                <div className="p-2.5 rounded bg-surface border border-red-500/40 text-[11px] text-amber-400 font-bold mt-2">
                  ⚠️ En el área penal: Se degrada a AMARILLA 🟨 SOLO si fue disputando el balón. Si fue sujeción o empujón ➜ ROJA 🟥.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-400 text-sm">SPA (Ataque Prometedor)</span>
                  <span className="px-2 py-0.5 rounded font-black text-[10px] bg-amber-500 text-slate-950">AMARILLA 🟨</span>
                </div>
                <p className="text-text-muted">Se sanciona cuando falta alguno de los 4 factores de DOGSO pero hay peligro:</p>
                <ul className="list-disc list-inside space-y-1 text-text">
                  <li>Hay compañeros con opción de pase claro.</li>
                  <li>Espacio abierto para avanzar con superioridad numérica.</li>
                  <li>Hay un defensor que aún podía cruzar a tiempo.</li>
                </ul>
                <div className="p-2.5 rounded bg-surface border border-amber-500/40 text-[11px] text-accent font-bold mt-2">
                  💡 Si concedes ventaja y termina en GOL ➜ NO se muestra tarjeta por SPA.
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Criterio de Manos */}
          <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-accent-subtle text-accent border border-accent/30">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-text">
                  Protocolo de Manos IFAB (Regla 12)
                </h3>
                <p className="text-xs text-text-muted">
                  Cómo discernir cuándo pitar penal o falta por contacto con brazo o mano.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-surface-2 border border-border space-y-2">
                <span className="font-bold text-red-500 text-sm flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-red-500" /> SÍ ES INFRACCIÓN (Pitar falta o penal)
                </span>
                <ul className="space-y-1.5 text-text-muted list-disc list-inside">
                  <li>Tocar el balón deliberadamente (movimiento del brazo hacia el balón).</li>
                  <li>Posición antinatural: el brazo hace que el cuerpo ocupe más espacio de manera no justificada por la acción.</li>
                  <li>Anotar en la portería contraria directamente con la mano o inmediatamente después de un toque accidental.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-surface-2 border border-border space-y-2">
                <span className="font-bold text-emerald-500 text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> NO ES INFRACCIÓN (Juega)
                </span>
                <ul className="space-y-1.5 text-text-muted list-disc list-inside">
                  <li>El balón proviene directamente de la cabeza o cuerpo del propio jugador tras jugarlo voluntariamente.</li>
                  <li>Brazo pegado al cuerpo o en posición justificada por la carrera o salto natural.</li>
                  <li>Mano de apoyo en el suelo durante una caída o barrida.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SECTION 4: FLASHCARDS PRE-PARTIDO ──────────────────────── */}
      {activeSection === 'flashcards' && (
        <div className="max-w-xl mx-auto space-y-5 text-center">
          <p className="text-xs text-text-muted">
            Toca la tarjeta para voltearla. Ideal para repasar 10 minutos antes de cada partido en la cancha.
          </p>

          <div
            onClick={() => {
              setIsFlipped(!isFlipped);
              sounds.playToastChime();
            }}
            className="cursor-pointer min-h-[260px] p-6 sm:p-8 rounded-2xl bg-surface border-2 border-accent/40 shadow-lg flex flex-col items-center justify-center text-center space-y-4 hover:border-accent transition-all select-none"
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-accent bg-accent-subtle px-3 py-1 rounded-full border border-accent/30">
              {isFlipped ? 'RESPUESTA Y CRITERIO IFAB' : 'PREGUNTA ARBITRAL RÁPIDA'}
            </span>

            <div className="text-base sm:text-lg font-black text-text leading-relaxed">
              {isFlipped
                ? REFEREE_CASES[flashcardIndex].options.find(o => o.isCorrect)?.text
                : REFEREE_CASES[flashcardIndex].situation}
            </div>

            <p className="text-[11px] text-text-muted flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-accent" />
              {isFlipped ? 'Toca para volver a la pregunta' : 'Toca para ver el criterio reglamentario'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                setIsFlipped(false);
                setFlashcardIndex(prev => (prev === 0 ? REFEREE_CASES.length - 1 : prev - 1));
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-surface-2 hover:bg-surface border border-border text-xs font-bold text-text transition-colors"
            >
              Anterior
            </button>

            <span className="text-xs font-mono text-text-muted">
              {flashcardIndex + 1} de {REFEREE_CASES.length}
            </span>

            <button
              onClick={() => {
                setIsFlipped(false);
                setFlashcardIndex(prev => (prev + 1) % REFEREE_CASES.length);
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-accent hover:opacity-95 text-slate-950 text-xs font-black transition-colors shadow-xs"
            >
              Siguiente Tarjeta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
