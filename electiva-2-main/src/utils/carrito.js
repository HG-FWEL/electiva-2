// src/utils/carrito.js
// Texto que explica por qué un producto del carrito cambió (lo usan el carrito y el checkout).
export function avisoItemCarrito(item) {
  if (!item.disponible) return 'Ya no está disponible: no se incluirá en tu compra.';
  if (item.ajustado) return `Solo quedan ${item.stock} unidades: ajustamos la cantidad.`;
  return null;
}
