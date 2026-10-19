// Guarda los datos del backend en archivos JSON dentro de backend/datos.
// Escribe primero en un archivo temporal y luego lo renombra, así un corte a
// mitad de escritura nunca deja el JSON corrupto.
const fs = require('fs');
const path = require('path');

const DIR_DATOS = path.join(__dirname, 'datos');

function rutaDe(nombre) {
  return path.join(DIR_DATOS, `${nombre}.json`);
}

function leer(nombre, valorPorDefecto) {
  const ruta = rutaDe(nombre);
  if (!fs.existsSync(ruta)) return valorPorDefecto;
  return JSON.parse(fs.readFileSync(ruta, 'utf8'));
}

function guardar(nombre, datos) {
  const ruta = rutaDe(nombre);
  const temporal = `${ruta}.tmp`;
  fs.writeFileSync(temporal, JSON.stringify(datos, null, 2));
  fs.renameSync(temporal, ruta);
}

// La primera vez que arranca el backend, el catálogo se copia desde
// productos-iniciales.json; de ahí en adelante se edita productos.json.
function leerProductos() {
  return leer('productos', null) ?? leer('productos-iniciales', []);
}

module.exports = {
  leerProductos,
  guardarProductos: (productos) => guardar('productos', productos),
  leerPedidos: () => leer('pedidos', []),
  guardarPedidos: (pedidos) => guardar('pedidos', pedidos),
  leerUsuarios: () => leer('usuarios', []),
  guardarUsuarios: (usuarios) => guardar('usuarios', usuarios),
};
