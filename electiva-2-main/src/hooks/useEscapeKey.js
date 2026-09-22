// src/hooks/useEscapeKey.js
import { useEffect } from 'react';

// Ejecuta onEscape cuando el usuario presiona Esc. Se usa en los modales
// (carrito, apartado de compra) para poder cerrarlos sin tocar el mouse.
export function useEscapeKey(onEscape, activo = true) {
  useEffect(() => {
    if (!activo) return;

    const manejarTecla = (e) => {
      if (e.key === 'Escape') {
        onEscape();
      }
    };

    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [onEscape, activo]);
}
