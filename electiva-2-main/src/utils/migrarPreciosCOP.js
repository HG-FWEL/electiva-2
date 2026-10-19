// src/utils/migrarPreciosCOP.js
// Antes los precios se guardaban en dólares y se multiplicaban por 4000 al
// mostrarlos. Ahora se guardan directamente en pesos, así que los datos que
// el navegador ya tenía en localStorage (carrito, favoritos, productos del
// admin, pedidos) se convierten una sola vez al cargar la app.

const MIGRACION_KEY = 'movimarket_precios_cop';
const TASA_CAMBIO_COP = 4000;

const aCOP = (valor) => Math.round(Number(valor) * TASA_CAMBIO_COP);

const convertirProducto = (producto) =>
  producto && producto.precio != null && producto.precio !== ''
    ? { ...producto, precio: aCOP(producto.precio) }
    : producto;

const convertirPedido = (pedido) => ({
  ...pedido,
  items: (pedido.items || []).map(convertirProducto),
  subtotal: aCOP(pedido.subtotal),
  costoEnvio: aCOP(pedido.costoEnvio),
  total: aCOP(pedido.total),
});

const convertirOverrides = (overrides) =>
  Object.fromEntries(Object.entries(overrides).map(([id, cambios]) => [id, convertirProducto(cambios)]));

const CONVERSIONES = {
  movimarket_carrito: (lista) => lista.map(convertirProducto),
  movimarket_favoritos: (lista) => lista.map(convertirProducto),
  movimarket_productos_admin: (lista) => lista.map(convertirProducto),
  movimarket_productos_overrides: convertirOverrides,
  movimarket_pedidos: (lista) => lista.map(convertirPedido),
};

export function migrarPreciosCOP() {
  try {
    if (window.localStorage.getItem(MIGRACION_KEY)) return;
    for (const [clave, convertir] of Object.entries(CONVERSIONES)) {
      const guardado = window.localStorage.getItem(clave);
      if (guardado) window.localStorage.setItem(clave, JSON.stringify(convertir(JSON.parse(guardado))));
    }
    window.localStorage.setItem(MIGRACION_KEY, '1');
  } catch (error) {
    console.warn('No se pudieron convertir los precios guardados a pesos:', error);
  }
}
