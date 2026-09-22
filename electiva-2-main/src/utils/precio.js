// src/utils/precio.js
// Los precios en el catálogo (src/data/Productos.js) están guardados en una
// unidad base (equivalente a USD) para que los cálculos del carrito sean
// simples. Esta función es la ÚNICA que decide cómo se muestran al usuario:
// en pesos colombianos, sin decimales, con separador de miles.
//
// Si la tasa de cambio real cambia, solo hay que actualizar este número.
const TASA_CAMBIO_COP = 4000;

export function formatPrecioCOP(valorBase) {
  const valorCOP = Math.round(Number(valorBase) * TASA_CAMBIO_COP);
  return valorCOP.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });
}
