import React, { useId, useState } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

/**
 * Logo interactivo de PRIME OS.
 * - Se dibuja al montar (badge, anillo y la P).
 * - Hover: se inclina siguiendo el mouse y el anillo se completa al 100 %.
 * - Clic/tap: vuelve a dibujarse.
 * - `progress` (0 a 1) es el % del anillo; úsalo con tu Prime Score (ej. 0.85).
 * Respeta prefers-reduced-motion (sin inclinación ni animaciones).
 *
 * Uso: <PrimeLogo size={40} progress={primeScore / 100} />
 */
export default function PrimeLogo({
  size = 64,
  progress = 0.74,
  showStatus = true,
  interactive = true,
  className = "",
}) {
  const uid = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const tilt = interactive && !reduce;
  const [replay, setReplay] = useState(0);
  const [hover, setHover] = useState(false);

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const sx = useSpring(rx, { stiffness: 200, damping: 18 });
  const sy = useSpring(ry, { stiffness: 200, damping: 18 });

  function onMove(e) {
    if (!tilt) return;
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 24);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 24);
  }

  function onLeave() {
    rx.set(0);
    ry.set(0);
    setHover(false);
  }

  return (
    <motion.div
      role="img"
      aria-label="PRIME OS"
      className={className}
      style={{
        width: size,
        height: size,
        rotateX: sx,
        rotateY: sy,
        transformPerspective: 500,
        cursor: interactive ? "pointer" : "default",
      }}
      whileHover={tilt ? { scale: 1.06 } : undefined}
      whileTap={tilt ? { scale: 0.94 } : undefined}
      onMouseMove={onMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={onLeave}
      onClick={() => interactive && setReplay((n) => n + 1)}
    >
      <svg
        key={replay}
        viewBox="0 0 120 120"
        width="100%"
        height="100%"
        style={{ overflow: "visible" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`${uid}g`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#38bdf8" />
            <stop offset="1" stopColor="#0369a1" />
          </linearGradient>
          <linearGradient id={`${uid}r`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#38bdf8" />
            <stop offset="1" stopColor="#34d399" />
          </linearGradient>
        </defs>

        {/* Anillo de progreso (pista + avance) */}
        <circle
          cx="60" cy="60" r="56" fill="none" strokeWidth="3"
          stroke="currentColor" opacity="0.12"
          transform="rotate(-90 60 60)"
        />
        <motion.circle
          cx="60" cy="60" r="56" fill="none" strokeWidth="3.5" strokeLinecap="round"
          stroke={`url(#${uid}r)`}
          transform="rotate(-90 60 60)"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: hover && !reduce ? 1 : progress }}
          transition={{ duration: hover ? 0.6 : 0.9, ease: "easeOut" }}
        />

        {/* Insignia */}
        <motion.rect
          x="18" y="18" width="84" height="84" rx="24"
          fill={`url(#${uid}g)`}
          initial={reduce ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
        />

        {/* La P, dibujada con trazo */}
        <motion.path
          d="M47 82V40H63a13 13 0 0 1 0 26H47"
          fill="none" stroke="#fff" strokeWidth="9"
          strokeLinecap="round" strokeLinejoin="round"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, delay: 0.25, ease: "easeOut" }}
        />

        {/* Punto de estado */}
        {showStatus && (
          <>
            {!reduce && (
              <motion.circle
                cx="94" cy="26" r="6.5" fill="#22c55e"
                animate={{ scale: [1, 2.6], opacity: [0.55, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 1 }}
              />
            )}
            <circle cx="94" cy="26" r="6.5" fill="#22c55e" />
          </>
        )}
      </svg>
    </motion.div>
  );
}
