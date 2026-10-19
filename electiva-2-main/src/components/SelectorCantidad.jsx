// src/components/SelectorCantidad.jsx
// Botones − / + para elegir cuántas unidades comprar, sin pasar del stock.
import React from 'react';
import './SelectorCantidad.css';

function SelectorCantidad({ cantidad, max, onCambiar, tamano = 'normal', etiqueta = 'Cantidad' }) {
  const tope = typeof max === 'number' ? max : Infinity;
  const enElTope = cantidad >= tope;

  return (
    <div className={`selector-cantidad selector-cantidad-${tamano}`} role="group" aria-label={etiqueta}>
      <button
        type="button"
        onClick={() => onCambiar(cantidad - 1)}
        disabled={cantidad <= 1}
        aria-label="Quitar una unidad"
      >
        −
      </button>
      <span aria-live="polite">{cantidad}</span>
      <button
        type="button"
        onClick={() => onCambiar(cantidad + 1)}
        disabled={enElTope}
        aria-label="Agregar una unidad"
        title={enElTope ? 'No hay más stock disponible' : undefined}
      >
        +
      </button>
    </div>
  );
}

export default SelectorCantidad;
