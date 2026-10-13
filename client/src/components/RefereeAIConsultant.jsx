import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale,
  Shield,
  BookOpen,
  Send,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  FileText,
  HelpCircle,
  Clock,
  Compass
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { haptics } from '../utils/haptics';
import { useToast } from '../context/ToastContext';

const QUICK_CONSULTATIONS = [
  {
    title: 'Fuera de juego · Balon peinado por defensor',
    question: 'Un delantero esta adelantado. Un defensor retrocede con vision clara, salta a rechazar de cabeza pero roza levemente el balon y este le cae al delantero adelantado, quien anota. Es gol o fuera de juego?'
  },
  {
    title: 'DOGSO · Sujecion dentro del area penal',
    question: 'Un delantero escapa solo frente al arquero dentro del area penal. El defensor lo sujeta de la camiseta derribandolo sin opcion de jugar el balon. Que sancion tecnica y disciplinaria corresponde?'
  },
  {
    title: 'Mano · Rebote del propio cuerpo',
    question: 'Un defensor salta a despejar de cabeza, impacta el balon limpiamente y de inmediato el balon rebota en su propio brazo que estaba abierto por el impulso del salto. Se sanciona penal?'
  },
  {
    title: 'Tiro Penal · Finta al patear',
    question: 'El ejecutor de un tiro penal completa su carrera, se detiene frente a la pelota simulando patear, engana al arquero y luego anota. Como se procede reglamentariamente?'
  },
  {
    title: 'Balon a Tierra · Toque en el arbitro',
    question: 'El balon impacta al arbitro dentro del area penal y le queda servido a un delantero rival quien remata a porteria. Como debe reanudar el arbitro?'
  },
  {
    title: 'Juego Brusco Grave · Plancha a la canilla',
    question: 'Un jugador entra con los tacos por delante a la altura de la espinilla del rival con pierna extendida y velocidad extrema. Que tarjeta corresponde?'
  }
];

export default function RefereeAIConsultant() {
  const { toast } = useToast();
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleConsult = async (queryText) => {
    const textToSubmit = queryText || question;
    if (!textToSubmit || !textToSubmit.trim()) return;

    try { sounds?.playToastChime?.(); } catch (_) {}
    try { haptics?.impactLight?.(); } catch (_) {}

    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/referee/ai-consultant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: textToSubmit.trim() })
      });

      const data = await res.json();
      if (data.success && data.answer) {
        setResult(data.answer);
        try { sounds?.playSuccessChime?.(); } catch (_) {}
        try { haptics?.seriesDone?.(); } catch (_) {}
      } else {
        toast.error({
          title: 'Error de consulta',
          message: data.error || 'No se pudo obtener el analisis de la jugada.'
        });
      }
    } catch (err) {
      toast.error({
        title: 'Error de conexion',
        message: 'No fue posible conectar con el servicio arbitral.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickClick = (q) => {
    setQuestion(q.question);
    handleConsult(q.question);
  };

  const handleCopyAnalysis = () => {
    if (!result) return;
    const summary = [
      `CONSULTA ARBITRAL IFAB`,
      `Pregunta: ${question}`,
      `Decision Tecnica: ${result.technicalDecision}`,
      `Sancion Disciplinaria: ${result.disciplinaryAction}`,
      `Reanudacion: ${result.restartPoint}`,
      `Regla IFAB: ${result.ifabLaw}`,
      `Fundamentacion: ${result.detailedReasoning}`,
      `Recomendacion Practica: ${result.practicalAdvice || 'N/A'}`
    ].join('\n\n');

    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success({
      title: 'Analisis copiado',
      message: 'Dictamen arbitral copiado al portapapeles.'
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header card */}
      <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs">
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-subtle border border-accent/30 flex items-center justify-center text-accent shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-text tracking-tight flex items-center gap-2">
                Consultor Tecnico Arbitral IFAB
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-accent-subtle text-accent border border-accent/20">
                  Reglamento Oficial
                </span>
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Plantea cualquier jugada polemica o situacion de partido para obtener dictamen tecnico, sancion y fundamentacion exacta.
              </p>
            </div>
          </div>
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleConsult();
          }}
          className="mt-4 space-y-3"
        >
          <div className="relative">
            <textarea
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Describe la jugada detalladamente (ej. Un defensor roza el balon con la mano de apoyo en el area tras barrerse...)"
              className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-xs sm:text-sm text-text placeholder:text-text-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-none font-sans"
            />
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-[11px] text-text-muted flex items-center gap-1.5 font-medium">
              <Compass className="w-3.5 h-3.5 text-accent" />
              Criterio basado en circulares oficiales IFAB y directrices COARC
            </span>

            <div className="flex items-center gap-2">
              {result && (
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setQuestion('');
                  }}
                  className="px-3 py-2 rounded-xl bg-surface-2 hover:bg-surface border border-border text-xs font-semibold text-text-muted hover:text-text transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Limpiar
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading || !question.trim()}
                className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-black text-xs transition-all shadow-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    Analizando jugada...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Consultar Dictamen
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Quick chip queries */}
        <div className="mt-4 pt-3 border-t border-border">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2">
            Consultas Frecuentes de Partido
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {QUICK_CONSULTATIONS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickClick(q)}
                className="px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-accent-subtle/50 hover:text-accent border border-border text-[11px] font-semibold text-text-muted whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
              >
                <BookOpen className="w-3 h-3 shrink-0" />
                {q.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result Display */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="p-5 sm:p-6 rounded-2xl bg-surface border border-accent/40 shadow-sm space-y-4"
          >
            {/* Result Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-text">Dictamen Arbitral Estructurado</h3>
                  <span className="text-[11px] font-mono text-accent font-semibold">{result.ifabLaw}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyAnalysis}
                className="px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface border border-border text-[11px] font-semibold text-text transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-accent" />}
                {copied ? 'Copiado' : 'Copiar Dictamen'}
              </button>
            </div>

            {/* Core decisions grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Decision Tecnica */}
              <div className="p-3.5 rounded-xl bg-surface-2 border border-border space-y-1">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider flex items-center gap-1.5">
                  <Scale className="w-3 h-3 text-accent" />
                  Decision Tecnica
                </span>
                <p className="text-xs font-bold text-text leading-snug">{result.technicalDecision}</p>
              </div>

              {/* Sancion Disciplinaria */}
              <div className="p-3.5 rounded-xl bg-surface-2 border border-border space-y-1">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-warning" />
                  Sancion Disciplinaria
                </span>
                <p className="text-xs font-bold text-text leading-snug">{result.disciplinaryAction}</p>
              </div>

              {/* Reanudacion */}
              <div className="p-3.5 rounded-xl bg-surface-2 border border-border space-y-1">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  Reanudacion
                </span>
                <p className="text-xs font-bold text-text leading-snug">{result.restartPoint}</p>
              </div>
            </div>

            {/* Fundamentacion */}
            <div className="p-4 rounded-xl bg-surface-2/60 border border-border space-y-2">
              <span className="text-[11px] uppercase font-bold text-text flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-accent" />
                Fundamentacion y Directrices Oficiales
              </span>
              <p className="text-xs text-text-muted leading-relaxed text-justify">{result.detailedReasoning}</p>
            </div>

            {/* Consejo practico para el arbitro */}
            {result.practicalAdvice && (
              <div className="p-3.5 rounded-xl bg-accent-subtle/30 border border-accent/20 flex items-start gap-2.5">
                <Compass className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <span className="font-bold text-text">Recomendacion de campo COARC:</span>
                  <p className="text-text-muted text-[11px]">{result.practicalAdvice}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
