import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplet, Plus, RotateCcw, CheckCircle2, Undo2 } from 'lucide-react';
import { sounds } from '../utils/audio';
import { haptics } from '../utils/haptics';
import AnimatedNumber from './AnimatedNumber';
import { useToast } from '../hooks/useToast';

export default function WaterTrackerWidget({ waterData, onDrink, onReset, addToast: addToastProp }) {
  const { toast } = useToast();
  const currentMl = waterData?.currentMl || 0;
  const goalMl = waterData?.goalMl || 2500;
  const percent = Math.min(100, Math.round((currentMl / goalMl) * 100));
  const glasses = Math.floor(currentMl / 250);
  const totalGlasses = Math.floor(goalMl / 250);

  // Undo state management
  const [previousMl, setPreviousMl] = useState(null);
  const [isBouncing, setIsBouncing] = useState(false);
  const undoTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  const handleDrink = (amount) => {
    sounds.playWaterDropSound();
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 400);

    const newMl = currentMl + amount;
    if (newMl >= goalMl && currentMl < goalMl) {
      haptics.waterGoal();
      toast.achievement({
        title: '¡Meta de agua alcanzada! (2.5L)',
        message: '2,500 ml completados. Tu rendimiento cognitivo y físico está al 100%.',
        category: 'water'
      });
    } else {
      toast.reminder({
        title: `+${amount} ml de agua registrados`,
        message: `Total: ${newMl} ml de tu meta diaria (2.5L). ¡Mantén tu energía alta!`,
        category: 'water'
      });
    }

    onDrink(amount);
  };

  const handleResetWithUndo = () => {
    if (currentMl === 0) return;
    const prev = currentMl;
    setPreviousMl(prev);
    onReset();

    toast.undo({
      title: 'Contador de agua reiniciado',
      message: 'Se reinició tu hidratación a 0 ml.',
      category: 'water',
      onUndo: () => {
        onDrink(prev);
        setPreviousMl(null);
        toast.success({
          title: 'Hidratación restaurada',
          message: `Se restauraron ${prev} ml de agua.`,
          category: 'water'
        });
      }
    });

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      setPreviousMl(null);
    }, 6000);
  };

  const handleUndo = () => {
    if (previousMl !== null) {
      onDrink(previousMl);
      const prev = previousMl;
      setPreviousMl(null);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      toast.success({
        title: 'Acción deshecha',
        message: `Se restauraron ${prev} ml de agua.`,
        category: 'water'
      });
    }
  };

  // Water bottle SVG height calculations
  const bottleHeight = 80;
  const waterHeight = (percent / 100) * bottleHeight;

  return (
    <section
      aria-label="Seguimiento de hidratación diaria"
      className="bg-surface/90 backdrop-blur-md border border-border p-5 sm:p-6 rounded-2xl transition-colors shadow-xs relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <motion.div
            animate={isBouncing ? { scale: [1, 1.25, 0.9, 1], rotate: [0, -8, 8, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="w-9 h-9 rounded-xl bg-accent-subtle text-accent flex items-center justify-center shrink-0"
          >
            <Droplet className="w-5 h-5 fill-current" />
          </motion.div>
          <div>
            <h3 className="text-sm font-bold text-text leading-tight">Hidratación Diaria</h3>
            <p className="text-xs text-text-muted mt-0.5">Meta: 2.5 Litros (10 vasos)</p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/20">
          <AnimatedNumber value={percent} format="percent" />
        </span>
      </div>

      {/* Interactive Water Visual Container */}
      <div className="flex items-center gap-4 mb-4">
        {/* Animated Bottle Silhouette */}
        <div className="relative w-12 h-20 bg-surface-2 border-2 border-border rounded-b-2xl rounded-t-lg overflow-hidden shrink-0 flex items-end justify-center shadow-inner">
          {/* Water Fill Level with wave effect */}
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${percent}%` }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="w-full bg-gradient-to-t from-accent to-accent-hover relative opacity-90"
          >
            {/* Top Wave */}
            <div className="absolute -top-1 left-0 right-0 h-2 bg-accent-subtle opacity-70 animate-pulse" />
          </motion.div>

          {/* Graduations */}
          <div className="absolute inset-y-0 right-1 flex flex-col justify-between py-2 pointer-events-none opacity-40">
            <span className="w-1.5 h-0.5 bg-text-muted" />
            <span className="w-2.5 h-0.5 bg-text-muted" />
            <span className="w-1.5 h-0.5 bg-text-muted" />
            <span className="w-2.5 h-0.5 bg-text-muted" />
          </div>
        </div>

        {/* Progress Bar & Details */}
        <div className="flex-1 space-y-2">
          <div
            role="progressbar"
            aria-label="Progreso de hidratación del día"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="relative w-full h-3 bg-surface-2 border border-border rounded-full overflow-hidden"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-accent rounded-full"
            />
          </div>

          <div className="flex justify-between items-center text-xs text-text-muted font-mono">
            <span>
              <AnimatedNumber value={currentMl} /> / {goalMl} ml
            </span>
            <span>
              <AnimatedNumber value={glasses} /> de {totalGlasses} vasos
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => handleDrink(250)}
          className="flex-1 py-2 px-3 rounded-xl bg-surface-2 hover:bg-surface border border-border text-text font-bold text-xs flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[44px] whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5 text-accent" /> +250 ml
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => handleDrink(500)}
          className="flex-1 py-2 px-3 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[44px] whitespace-nowrap shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" /> +500 ml
        </motion.button>

        {previousMl !== null ? (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={handleUndo}
            title="Deshacer reinicio de agua"
            aria-label="Deshacer reinicio de agua"
            className="px-3 py-2 rounded-xl bg-warning-subtle text-warning border border-warning/40 font-bold text-xs flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning min-h-[44px] whitespace-nowrap"
          >
            <Undo2 className="w-3.5 h-3.5" /> Deshacer
          </motion.button>
        ) : (
          <button
            onClick={handleResetWithUndo}
            title="Reiniciar contador de agua"
            aria-label="Reiniciar contador de agua a cero"
            className="p-2.5 rounded-xl bg-surface-2 hover:bg-surface border border-border text-text-muted hover:text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {percent >= 100 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 text-xs font-semibold text-success bg-success-subtle border border-success/30 p-2.5 rounded-xl"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>¡Meta de 2.5L cumplida! Mantén tu nivel óptimo de hidratación.</span>
        </motion.div>
      )}
    </section>
  );
}
