import { useEffect, useState } from 'react';

const EDITABLE_SELECTOR =
  'input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=button]):not([type=submit]):not([type=color]):not([type=file]), textarea, select, [contenteditable=""], [contenteditable="true"]';

/**
 * Detecta si el teclado virtual está (probablemente) abierto en móvil.
 * Combina dos señales:
 *  1. Foco en un campo editable (funciona aunque el navegador no redimensione).
 *  2. visualViewport más bajo que la ventana (Android/iOS con teclado visible).
 * Se usa para ocultar la barra inferior y que no quede encima de los inputs.
 */
export function useKeyboardOpen() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    // Solo tiene sentido en dispositivos táctiles
    const isTouch = window.matchMedia?.('(pointer: coarse)').matches;
    if (!isTouch) return undefined;

    let focused = false;
    let shrunk = false;
    const update = () => setIsOpen(focused || shrunk);

    const onFocusIn = (e) => {
      focused = !!(e.target instanceof Element && e.target.matches(EDITABLE_SELECTOR));
      update();
    };
    const onFocusOut = () => {
      // Espera a que el foco se mueva (p. ej. de un input a otro) antes de decidir
      setTimeout(() => {
        const el = document.activeElement;
        focused = !!(el instanceof Element && el.matches(EDITABLE_SELECTOR));
        update();
      }, 50);
    };

    const vv = window.visualViewport;
    const onViewportResize = () => {
      if (!vv) return;
      shrunk = vv.height < window.innerHeight * 0.75;
      update();
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    vv?.addEventListener('resize', onViewportResize);

    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      vv?.removeEventListener('resize', onViewportResize);
    };
  }, []);

  return isOpen;
}
