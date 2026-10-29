// Acceso a los datos de la tienda en Supabase. Traduce entre las tablas del
// esquema (productos, variantes_producto, pedidos, pagos, usuarios...) y los
// objetos que la API ha usado siempre, para que el frontend no note el cambio.
// Las operaciones que tocan varias tablas a la vez son funciones SQL
// (ver supabase/migracion-tienda.sql).
const supabase = require('./supabase');

// Los slugs de categoría del frontend que no coinciden con los de la tabla categorias.
const CATEGORIA_A_DB = { escritorio: 'pcs-de-escritorio', 'all-in-one': 'todo-en-uno' };
const CATEGORIA_DESDE_DB = Object.fromEntries(Object.entries(CATEGORIA_A_DB).map(([web, db]) => [db, web]));
const CATEGORIAS_WEB = [
  'computadores', 'escritorio', 'all-in-one', 'gaming', 'consolas',
  'tablets', 'celulares', 'apple-watch', 'accesorios',
];

// Marca que se asigna cuando el producto no tiene una (marca_id es obligatoria).
const MARCA_GENERICA = 'Genérica';

const ROL_ADMIN = 2;
const ROL_CLIENTE = 1;

// Hash de las cuentas creadas al comprar como invitado: no es un hash bcrypt,
// así que nadie puede iniciar sesión con ellas hasta que se registren.
const SIN_CLAVE = 'sin-clave';

const ERRORES_SQL = { MM400: 400, MM404: 404, MM409: 409 };

// Convierte un error de Supabase en uno que el manejador de errores de Express
// responde con el status correcto. Los errores propios (MM4xx) muestran su mensaje.
function errorDeSupabase(error) {
  const status = ERRORES_SQL[error.code];
  const resultado = new Error(status ? error.message : `Supabase: ${error.message}`);
  resultado.status = status ?? 500;
  return resultado;
}

function revisar({ data, error }) {
  if (error) throw errorDeSupabase(error);
  return data;
}

const categoriaValida = (categoria) => CATEGORIAS_WEB.includes(categoria);

// --- Productos ----------------------------------------------------------

const SELECT_PRODUCTO = `
  sku, nombre, descripcion, precio, precio_oferta, oferta_desde, oferta_hasta, modelo3d_url,
  categorias(slug), marcas(nombre),
  imagenes_producto(url_imagen, es_portada, orden),
  variantes_producto(stock, precio_adicional, activo),
  especificaciones_tecnicas(clave, valor)`;

// Mismo cálculo que tienda_precio_vigente() en SQL: es el precio que se cobra.
function precioVigente(fila) {
  const ahora = Date.now();
  const ofertaVigente =
    fila.precio_oferta !== null &&
    (!fila.oferta_desde || new Date(fila.oferta_desde) <= ahora) &&
    (!fila.oferta_hasta || new Date(fila.oferta_hasta) >= ahora);
  return Number(ofertaVigente ? fila.precio_oferta : fila.precio);
}

function aProducto(fila) {
  const specs = fila.especificaciones_tecnicas ?? [];
  const resumen = specs.find((s) => s.clave === 'Resumen')?.valor;
  const linea = specs.find((s) => s.clave === 'Línea')?.valor;
  const otras = specs.filter((s) => s.clave !== 'Resumen' && s.clave !== 'Línea');
  const imagenes = [...(fila.imagenes_producto ?? [])].sort((a, b) => b.es_portada - a.es_portada || a.orden - b.orden);
  // Solo se venden las variantes sin recargo, así que solo esas cuentan como stock.
  const stock = (fila.variantes_producto ?? [])
    .filter((v) => v.activo && Number(v.precio_adicional) === 0)
    .reduce((suma, v) => suma + v.stock, 0);
  const marca = fila.marcas?.nombre;

  const producto = {
    id: fila.sku,
    nombre: fila.nombre,
    categoria: CATEGORIA_DESDE_DB[fila.categorias?.slug] ?? fila.categorias?.slug,
    marca: marca === MARCA_GENERICA ? undefined : marca,
    linea,
    especificaciones: resumen ?? otras.map((s) => `${s.clave}: ${s.valor}`).join(' · '),
    descripcion: fila.descripcion ?? '',
    precio: precioVigente(fila),
    stock,
    imagen: imagenes[0]?.url_imagen ?? '',
    modelo3d: fila.modelo3d_url ?? undefined,
  };
  // Igual que antes: los campos opcionales vacíos no se envían.
  return Object.fromEntries(Object.entries(producto).filter(([, valor]) => valor !== undefined && valor !== ''));
}

async function listarProductos() {
  const filas = revisar(
    await supabase.from('productos').select(SELECT_PRODUCTO).eq('activo', true).order('id')
  );
  return filas.map(aProducto);
}

async function obtenerProducto(id) {
  const fila = revisar(
    await supabase.from('productos').select(SELECT_PRODUCTO).eq('sku', id).eq('activo', true).maybeSingle()
  );
  return fila ? aProducto(fila) : null;
}

// Crea o actualiza un producto. Con `anterior` (al editar) el precio y las
// especificaciones solo se tocan si cambiaron: así no se borra una oferta ni
// se duplican las especificaciones técnicas que ya tenía en Supabase.
async function guardarProducto(producto, anterior = null) {
  const datos = {
    sku: producto.id,
    nombre: producto.nombre,
    categoria: CATEGORIA_A_DB[producto.categoria] ?? producto.categoria,
    marca: producto.marca ?? '',
    descripcion: producto.descripcion ?? '',
    imagen: producto.imagen,
    stock: producto.stock,
    modelo3d: producto.modelo3d ?? '',
    linea: producto.linea ?? '',
  };
  if (!anterior || producto.precio !== anterior.precio) datos.precio = producto.precio;
  if (!anterior || (producto.especificaciones ?? '') !== (anterior.especificaciones ?? '')) {
    datos.especificaciones = producto.especificaciones ?? '';
  }

  revisar(await supabase.rpc('tienda_guardar_producto', { p: datos }));
  return obtenerProducto(producto.id);
}

// Los productos no se borran (los pedidos los referencian): se desactivan.
async function desactivarProducto(id) {
  const filas = revisar(
    await supabase.from('productos').update({ activo: false }).eq('sku', id).eq('activo', true).select('id')
  );
  return filas.length > 0;
}

// --- Usuarios -----------------------------------------------------------

const SELECT_USUARIO = 'id, nombre, apellido, email, password_hash, rol_id, activo';

function aUsuario(fila) {
  return {
    id: String(fila.id),
    nombre: [fila.nombre, fila.apellido].filter(Boolean).join(' '),
    email: fila.email,
    passwordHash: fila.password_hash === SIN_CLAVE ? null : fila.password_hash,
    rol: fila.rol_id === ROL_ADMIN ? 'admin' : 'cliente',
    activo: fila.activo,
  };
}

// "Ana María López" -> nombre "Ana", apellido "María López" (la tabla los pide separados).
function separarNombre(nombreCompleto) {
  const [nombre, ...resto] = nombreCompleto.trim().split(/\s+/);
  return { nombre: nombre.slice(0, 100), apellido: resto.join(' ').slice(0, 100) };
}

async function buscarUsuarioPorEmail(email) {
  const fila = revisar(await supabase.from('usuarios').select(SELECT_USUARIO).eq('email', email).maybeSingle());
  return fila ? aUsuario(fila) : null;
}

async function buscarUsuarioPorId(id) {
  if (!/^\d+$/.test(String(id))) return null; // tokens de antes de Supabase ("user-...")
  const fila = revisar(await supabase.from('usuarios').select(SELECT_USUARIO).eq('id', id).maybeSingle());
  return fila ? aUsuario(fila) : null;
}

// passwordHash null = cuenta de invitado (sin contraseña).
async function crearUsuario({ nombre, email, passwordHash, rol = 'cliente' }) {
  const fila = revisar(
    await supabase
      .from('usuarios')
      .insert({
        ...separarNombre(nombre),
        email,
        password_hash: passwordHash ?? SIN_CLAVE,
        rol_id: rol === 'admin' ? ROL_ADMIN : ROL_CLIENTE,
      })
      .select(SELECT_USUARIO)
      .single()
  );
  return aUsuario(fila);
}

// Una cuenta de invitado pasa a ser normal cuando su dueño se registra.
async function activarCuentaInvitado(id, { nombre, passwordHash }) {
  const fila = revisar(
    await supabase
      .from('usuarios')
      .update({ ...separarNombre(nombre), password_hash: passwordHash })
      .eq('id', id)
      .eq('password_hash', SIN_CLAVE)
      .select(SELECT_USUARIO)
      .maybeSingle()
  );
  return fila ? aUsuario(fila) : null;
}

async function registrarInicioSesion(id) {
  revisar(await supabase.from('usuarios').update({ ultimo_login: new Date().toISOString() }).eq('id', id));
}

// --- Pedidos ------------------------------------------------------------

const SELECT_PEDIDO = `
  id, referencia, fecha_pedido, updated_at, estado, facturacion_snapshot, subtotal, costo_envio, monto_total,
  detalles_pedido(id, cantidad, precio_unitario, nombre_producto,
    variantes_producto(productos(sku, imagenes_producto(url_imagen, es_portada)))),
  pagos(id, estado_pago, transaccion_id, fecha_pago)`;

const ESTADOS_ENVIADO = ['enviado', 'entregado'];

function aPedido(fila) {
  const snapshot = fila.facturacion_snapshot ?? {};
  const pago = [...(fila.pagos ?? [])].sort((a, b) => b.id - a.id)[0];
  const total = Number(fila.monto_total);
  const enviado = ESTADOS_ENVIADO.includes(fila.estado);

  // Un producto repartido entre varias variantes se muestra como una sola línea.
  const items = new Map();
  for (const detalle of [...(fila.detalles_pedido ?? [])].sort((a, b) => a.id - b.id)) {
    const producto = detalle.variantes_producto?.productos;
    const id = producto?.sku ?? detalle.nombre_producto;
    const existente = items.get(id);
    if (existente) {
      existente.cantidad += detalle.cantidad;
      continue;
    }
    const portada = (producto?.imagenes_producto ?? []).find((i) => i.es_portada) ?? producto?.imagenes_producto?.[0];
    items.set(id, {
      id,
      nombre: detalle.nombre_producto,
      imagen: portada?.url_imagen ?? '',
      precio: Number(detalle.precio_unitario),
      cantidad: detalle.cantidad,
    });
  }

  return {
    referencia: fila.referencia,
    fecha: fila.fecha_pedido,
    cliente: snapshot.cliente ?? {},
    usuario: snapshot.usuario ?? null,
    metodoEnvio: snapshot.metodoEnvio,
    items: [...items.values()],
    subtotal: Number(fila.subtotal),
    costoEnvio: Number(fila.costo_envio),
    total,
    montoCentavos: Math.round(total * 100),
    pago: pago
      ? { estado: pago.estado_pago, transaccionId: pago.transaccion_id, verificadoEn: pago.fecha_pago }
      : { estado: 'iniciado', transaccionId: null, verificadoEn: null },
    envio: { estado: enviado ? 'enviado' : 'revision', fecha: enviado ? fila.updated_at : null },
    stockDescontado: pago?.estado_pago === 'aprobado',
  };
}

async function listarPedidos() {
  const filas = revisar(
    await supabase.from('pedidos').select(SELECT_PEDIDO).not('referencia', 'is', null).order('fecha_pedido', { ascending: false })
  );
  return filas.map(aPedido);
}

async function obtenerPedido(referencia) {
  const fila = revisar(await supabase.from('pedidos').select(SELECT_PEDIDO).eq('referencia', referencia).maybeSingle());
  return fila ? aPedido(fila) : null;
}

// items: [{ id, cantidad }] sin ids repetidos. Precios y stock los revisa la base de datos.
async function crearPedido({ referencia, usuarioId, cliente, usuario, metodoEnvio, costoEnvio, items }) {
  revisar(
    await supabase.rpc('tienda_crear_pedido', {
      p_referencia: referencia,
      p_usuario_id: Number(usuarioId),
      p_direccion_texto: `${cliente.direccion}, ${cliente.ciudad}`,
      p_snapshot: { cliente, usuario, metodoEnvio },
      p_costo_envio: costoEnvio,
      p_items: items.map(({ id, cantidad }) => ({ sku: id, cantidad })),
    })
  );
  return obtenerPedido(referencia);
}

// estado: pendiente | aprobado | rechazado. Al aprobarse descuenta el stock una sola vez.
async function registrarPago(referencia, { transaccionId, estado, respuesta = null, descontarStock = true }) {
  revisar(
    await supabase.rpc('tienda_registrar_pago', {
      p_referencia: referencia,
      p_transaccion_id: transaccionId,
      p_estado: estado,
      p_respuesta: respuesta,
      p_descontar_stock: descontarStock,
    })
  );
  return obtenerPedido(referencia);
}

// envio: "enviado" o "revision" (vuelve a "pagado").
async function cambiarEstadoEnvio(referencia, envio) {
  revisar(
    await supabase
      .from('pedidos')
      .update({ estado: envio === 'enviado' ? 'enviado' : 'pagado' })
      .eq('referencia', referencia)
  );
  return obtenerPedido(referencia);
}

module.exports = {
  categoriaValida,
  listarProductos,
  obtenerProducto,
  guardarProducto,
  desactivarProducto,
  buscarUsuarioPorEmail,
  buscarUsuarioPorId,
  crearUsuario,
  activarCuentaInvitado,
  registrarInicioSesion,
  listarPedidos,
  obtenerPedido,
  crearPedido,
  registrarPago,
  cambiarEstadoEnvio,
};
