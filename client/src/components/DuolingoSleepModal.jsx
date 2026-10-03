import React, { useEffect, useRef, useState } from 'react';
import { Moon, CheckSquare, AlertCircle, Sparkles, Zap, X } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function DuolingoSleepModal({
  isOpen,
  onConfirmSleep,
  chores,
  onToggleChore,
  onSnooze
}) {
  const [nagCount, setNagCount] = useState(1);
  const dialogRef = useRef(null);
  const confirmButtonRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElementRef.current = document.activeElement;
    sounds.playDuolingoAlarmSound();

    // Focus primary button when modal opens
    setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 50);

    const interval = setInterval(() => {
      sounds.playDuolingoAlarmSound();
      setNagCount((prev) => prev + 1);
    }, 8000);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onSnooze();
      }

      // Trap focus inside modal
      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearInterval(interval);
      document.removeEventListener('keydown', handleKeyDown);
      previousActiveElementRef.current?.focus();
    };
  }, [isOpen, onSnooze]);

  if (!isOpen) return null;

  const pendingChores = chores.filter((c) => !c.done);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="duolingo-modal-title"
        aria-describedby="duolingo-modal-desc"
        className="w-full max-w-lg bg-surface border border-border rounded-2xl p-6 sm:p-7 shadow-2xl text-center relative max-h-[90vh] overflow-y-auto duolingo-alarm-active text-text"
      >
        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-accent-subtle text-accent mx-auto mb-4 flex items-center justify-center">
          <Moon className="w-7 h-7 fill-current" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-warning-subtle text-warning border border-warning/30 rounded-full text-xs font-black tracking-wider uppercase mb-2">
          <Zap className="w-3.5 h-3.5" />
          MODO DISCIPLINA DUOLINGO (Alerta #{nagCount})
        </div>

        <h2 id="duolingo-modal-title" className="text-xl sm:text-2xl font-black text-text tracking-tight">
          ¡Alejo, son las 10:00 PM! <br />
          <span className="text-accent">A la cama para tu Prime de mañana.</span>
        </h2>

        <p id="duolingo-modal-desc" className="text-xs sm:text-sm text-text-muted mt-2 max-w-md mx-auto leading-relaxed">
          Para rendir en la U, en tu Trabajo de Grado, arbitrar con energía y cumplir en Outlier, 
          <strong> el descanso es obligatorio</strong>. Revisa tus quehaceres y desconecta pantallas.
        </p>

        {/* Chores List */}
        <div className="mt-5 text-left bg-surface-2 border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5" /> Quehaceres de Hoy:
            </span>
            <span className="text-xs text-text-muted font-mono font-medium">
              {chores.filter((c) => c.done).length} de {chores.length} listos
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {chores.map((chore) => (
              <label
                key={chore.id}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-surface border border-border hover:border-accent/40 cursor-pointer transition-colors min-h-[44px]"
              >
                <input
                  type="checkbox"
                  checked={chore.done}
                  onChange={() => onToggleChore(chore.id)}
                  className="w-4 h-4 rounded text-accent focus:ring-accent border-border bg-surface-2 cursor-pointer"
                />
                <span className={`text-xs sm:text-sm font-medium ${chore.done ? 'line-through text-text-muted' : 'text-text'}`}>
                  {chore.text}
                </span>
              </label>
            ))}
          </div>

          {pendingChores.length > 0 && (
            <div className="mt-3 flex items-start gap-2 text-xs text-warning bg-warning-subtle p-2.5 rounded-lg border border-warning/30">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Tienes {pendingChores.length} tarea(s) pendiente(s). Si no son críticas, reporgrámalas y descansa.</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
          <button
            ref={confirmButtonRef}
            onClick={onConfirmSleep}
            className="flex-1 py-3 px-5 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-black text-xs sm:text-sm tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[44px] flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            ¡Ya me voy a dormir, apagando pantallas!
          </button>

          <button
            onClick={onSnooze}
            className="py-3 px-4 rounded-xl bg-surface-2 hover:bg-surface text-text-muted hover:text-text font-bold text-xs border border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[44px] flex items-center justify-center"
          >
            Posponer 5 min
          </button>
        </div>
      </div>
    </div>
  );
}
