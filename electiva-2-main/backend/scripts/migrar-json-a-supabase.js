// Pasa a Supabase los datos que el backend guardaba en backend/datos/*.json:
// productos, usuarios y pedidos. Se puede correr varias veces: lo que ya está
// en Supabase (mismo sku, correo o referencia) se actualiza o se salta.
//
//   cd backend && node scripts/migrar-json-a-supabase.js
//
// Requiere haber ejecutado antes supabase/migracion-tienda.sql.
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabase = require('../supabase');
const {
  guardarProducto,
  buscarUsuarioPorEmail,
  crearUsuario,
  obtenerPedido,
  crearPedido,
  registrarPago,
  cambiarEstadoEnvio,
} = require('../almacen');

const DIR_DATOS = path.join(__dirname, '..', 'datos');

function leerJson(nombre, valorPorDefecto) {
  const ruta = path.join(DIR_DATOS, `${nombre}.json`);
  return fs.existsSync(ruta) ? JSON.parse(fs.readFileSync(ruta, 'utf8')) : valorPorDefecto;
}

// En los JSON muchos productos no tenían marca; en Supabase es obligatoria.
// Se deduce del nombre y, si no se reconoce, queda como "Genérica".
const MARCAS_POR_NOMBRE = [
  [/\b(macbook|imac|apple)\b/i, 'Apple'],
  [/\balienware\b/i, 'Alienware'],
  [/\bdell\b/i, 'Dell'],
  [/\bhp\b/i, 'HP'],
  [/\blenovo\b/i, 'Lenovo'],
  [/\basus\b/i, 'Asus'],
  [/\bmsi\b/i, 'MSI'],
  [/\bacer\b/i, 'Acer'],
  [/\brazer\b/i, 'Razer'],
  [/\blg\b/i, 'LG'],
  [/\bhyperx\b/i, 'HyperX'],
  [/\blogitech\b/i, 'Logitech'],
];

function deducirMarca(nombre) {
  return MARCAS_POR_NOMBRE.find(([patron]) => patron.test(nombre))?.[1];
}

async function migrarProductos() {
  const productos = leerJson('productos', null) ?? leerJson('productos-iniciales', []);
  for (const producto of productos) {
    await guardarProducto({ ...producto, marca: producto.marca || deducirMarca(producto.nombre) });
  }
  console.log(`Productos: ${productos.length} creados o actualizados`);
}

async function migrarUsuarios() {
  const usuarios = leerJson('usuarios', []);
  let creados = 0;
  for (const usuario of usuarios) {
    if (await buscarUsuarioPorEmail(usuario.email)) continue;
    await crearUsuario({ nombre: usuario.nombre, email: usuario.email, passwordHash: usuario.passwordHash, rol: usuario.rol });
    creados += 1;
  }
  console.log(`Usuarios: ${creados} creados, ${usuarios.length - creados} ya existían`);
}

async function usuarioDe(pedido) {
  const email = (pedido.usuario?.email ?? pedido.cliente.email).trim().toLowerCase();
  const existente = await buscarUsuarioPorEmail(email);
  if (existente) return existente.id;
  return (await crearUsuario({ nombre: pedido.cliente.nombre, email, passwordHash: null })).id;
}

async function migrarPedidos() {
  // Del más antiguo al más reciente, para que los ids queden en orden.
  const pedidos = [...leerJson('pedidos', [])].reverse();
  let creados = 0;
  for (const pedido of pedidos) {
    if (await obtenerPedido(pedido.referencia)) continue;
    try {
      await crearPedido({
        referencia: pedido.referencia,
        usuarioId: await usuarioDe(pedido),
        cliente: pedido.cliente,
        usuario: pedido.usuario,
        metodoEnvio: pedido.metodoEnvio,
        costoEnvio: pedido.costoEnvio,
        items: pedido.items.map(({ id, cantidad }) => ({ id, cantidad })),
      });
    } catch (error) {
      console.warn(`  Pedido ${pedido.referencia} no se pudo migrar: ${error.message}`);
      continue;
    }
    const { error } = await supabase.from('pedidos').update({ fecha_pedido: pedido.fecha }).eq('referencia', pedido.referencia);
    if (error) throw error;

    if (pedido.pago.estado !== 'iniciado') {
      // El stock de los JSON ya tiene descontadas estas ventas.
      await registrarPago(pedido.referencia, {
        transaccionId: pedido.pago.transaccionId,
        estado: pedido.pago.estado,
        respuesta: { verificadoEn: pedido.pago.verificadoEn, migradoDesdeJson: true },
        descontarStock: false,
      });
    }
    if (pedido.envio.estado === 'enviado') await cambiarEstadoEnvio(pedido.referencia, 'enviado');
    creados += 1;
  }
  console.log(`Pedidos: ${creados} creados, ${pedidos.length - creados} ya existían o fallaron`);
}

async function main() {
  await migrarProductos();
  await migrarUsuarios();
  await migrarPedidos();
}

main().catch((error) => {
  console.error('La migración falló:', error.message);
  process.exit(1);
});
