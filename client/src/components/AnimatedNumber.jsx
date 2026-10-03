import React, { useEffect, useState, useRef } from 'react';

export default function AnimatedNumber({
  value = 0,
  duration = 750,
  format = 'number',
  decimals = 0,
  className = ''
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const startValueRef = useRef(value);
  const startTimeRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    // Check for prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(value);
      return;
    }

    startValueRef.current = displayValue;
    startTimeRef.current = null;

    const animate = (currentTime) => {
      if (!startTimeRef.current) startTimeRef.current = currentTime;
      const progress = Math.min((currentTime - startTimeRef.current) / duration, 1);

      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = startValueRef.current + (value - startValueRef.current) * easeProgress;

      setDisplayValue(currentVal);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [value, duration]);

  const formatOutput = (val) => {
    if (format === 'cop') {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      }).format(Math.round(val));
    }

    if (format === 'percent') {
      return `${Math.round(val)}%`;
    }

    if (format === 'hours') {
      return `${val.toFixed(1)}h`;
    }

    if (decimals > 0) {
      return val.toFixed(decimals);
    }

    return new Intl.NumberFormat('es-CO').format(Math.round(val));
  };

  return (
    <span className={`tabular-nums font-mono ${className}`}>
      {formatOutput(displayValue)}
    </span>
  );
}
