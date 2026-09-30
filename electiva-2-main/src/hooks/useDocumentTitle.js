// src/hooks/useDocumentTitle.js
import { useEffect } from 'react';

// Actualiza el título de la pestaña del navegador según la página activa.
// Es un "meta" básico sin depender de librerías externas (react-helmet, etc).
export function useDocumentTitle(titulo) {
  useEffect(() => {
    const anterior = document.title;
    document.title = titulo ? `${titulo} · MóvilMarket` : 'MóvilMarket';
    return () => {
      document.title = anterior;
    };
  }, [titulo]);
}
