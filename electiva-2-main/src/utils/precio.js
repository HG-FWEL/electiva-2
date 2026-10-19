// src/utils/precio.js
// Todos los precios de la tienda (catálogo, carrito, pedidos) están en pesos
// colombianos. Esta función es la ÚNICA que decide cómo se muestran al usuario:
// sin decimales y con separador de miles.

export function formatPrecioCOP(valorCOP) {
  return Math.round(Number(valorCOP)).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });
}
