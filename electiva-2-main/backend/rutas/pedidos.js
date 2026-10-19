const express = require('express');
const { leerProductos, guardarProductos, leerPedidos, guardarPedidos } = require('../almacen');
const { ESTADOS_WOMPI, firmaIntegridad, consultarTransaccion } = require('../wompi');

const { requiereAdmin } = require('../auth');

const router = express.Router();

const MONEDA = 'COP';

// Costo de cada método de envío en pesos. El frontend muestra los mismos
// valores, pero el que se cobra es siempre el de aquí.
const COSTOS_ENVIO = { estandar: 0, express: 60000 };

const CAMPOS_CLIENTE = ['nombre', 'email', 'telefono', 'direccion', 'ciudad'];

function validarCliente(cliente) {
  if (!cliente || typeof cliente !== 'object') return 'Faltan los datos del cliente';
  for (const campo of CAMPOS_CLIENTE) {
    if (typeof cliente[campo] !== 'string' || !cliente[campo].trim()) return `Falta el campo cliente.${campo}`;
  }
  if (!/^\S+@\S+\.\S+$/.test(cliente.email)) return 'El correo del cliente no es válido';
  return null;
}

// Junta las cantidades de un mismo producto: [{id, cantidad}] -> Map(id -> cantidad).
function agruparItems(items) {
  if (!Array.isArray(items) || items.length === 0) return { error: 'El pedido debe tener al menos un producto' };
  const cantidades = new Map();
  for (const item of items) {
    if (!item || typeof item.id !== 'string' || !Number.isInteger(item.cantidad) || item.cantidad < 1) {
      return { error: 'Cada producto debe tener id (texto) y cantidad (entero mayor que 0)' };
    }
    cantidades.set(item.id, (cantidades.get(item.id) || 0) + item.cantidad);
  }
  return { cantidades };
}

function generarReferencia() {
  return `MM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// Resta del stock lo vendido en un pedido aprobado (una sola vez por pedido).
function descontarStock(pedido) {
  const productos = leerProductos();
  for (const item of pedido.items) {
    const producto = productos.find((p) => p.id === item.id);
    if (producto) producto.stock = Math.max(0, producto.stock - item.cantidad);
  }
  guardarProductos(productos);
  pedido.stockDescontado = true;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Cliente:
 *       type: object
 *       required: [nombre, email, telefono, direccion, ciudad]
 *       properties:
 *         nombre:
 *           type: string
 *           example: Ana Pérez
 *         email:
 *           type: string
 *           example: ana@correo.com
 *         telefono:
 *           type: string
 *           example: '3001234567'
 *         direccion:
 *           type: string
 *           example: Calle 10 # 20-30
 *         ciudad:
 *           type: string
 *           example: Medellín
 *         notas:
 *           type: string
 *     Pedido:
 *       type: object
 *       properties:
 *         referencia:
 *           type: string
 *           description: Número del pedido (también es la referencia del pago en Wompi)
 *           example: MM-1760000000000-AB12
 *         fecha:
 *           type: string
 *           format: date-time
 *         cliente:
 *           $ref: '#/components/schemas/Cliente'
 *         usuario:
 *           type: object
 *           nullable: true
 *           description: Cuenta registrada que hizo la compra (null si fue como invitado)
 *         metodoEnvio:
 *           type: string
 *           enum: [estandar, express]
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: cel-1
 *               nombre:
 *                 type: string
 *                 example: iPhone 15 Pro Max
 *               imagen:
 *                 type: string
 *               precio:
 *                 type: number
 *                 description: Precio unitario en pesos, tomado del catálogo del backend
 *                 example: 4796000
 *               cantidad:
 *                 type: integer
 *                 example: 1
 *         subtotal:
 *           type: number
 *           example: 4796000
 *         costoEnvio:
 *           type: number
 *           example: 0
 *         total:
 *           type: number
 *           description: Total en pesos que se cobra en Wompi
 *           example: 4796000
 *         pago:
 *           type: object
 *           properties:
 *             estado:
 *               type: string
 *               enum: [iniciado, aprobado, pendiente, rechazado]
 *               description: iniciado = se abrió el pago pero Wompi aún no lo confirma
 *             transaccionId:
 *               type: string
 *               nullable: true
 *             verificadoEn:
 *               type: string
 *               format: date-time
 *               nullable: true
 *         envio:
 *           type: object
 *           properties:
 *             estado:
 *               type: string
 *               enum: [revision, enviado]
 *             fecha:
 *               type: string
 *               format: date-time
 *               nullable: true
 */

/**
 * @swagger
 * /api/pedidos:
 *   get:
 *     summary: Lista los pedidos (el más reciente primero) · solo administradores
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estadoPago
 *         required: false
 *         description: Filtra por estado del pago. Se pueden pasar varios separados por coma.
 *         schema:
 *           type: string
 *         example: aprobado,pendiente
 *     responses:
 *       401:
 *         description: Sin sesión o sesión vencida
 *       403:
 *         description: La sesión no es de administrador
 *       200:
 *         description: Lista de pedidos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pedido'
 *   post:
 *     summary: Crea un pedido y devuelve la firma para pagarlo con Wompi
 *     description: >
 *       El backend toma los precios de su propio catálogo, revisa el stock, suma el envío
 *       y firma ese total. El cliente nunca decide cuánto se cobra.
 *     tags: [Pedidos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items, metodoEnvio, cliente]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: cel-1
 *                     cantidad:
 *                       type: integer
 *                       example: 1
 *               metodoEnvio:
 *                 type: string
 *                 enum: [estandar, express]
 *               cliente:
 *                 $ref: '#/components/schemas/Cliente'
 *               usuario:
 *                 type: object
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Pedido creado; con estos datos se abre el widget de Wompi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pedido:
 *                   $ref: '#/components/schemas/Pedido'
 *                 pago:
 *                   type: object
 *                   properties:
 *                     referencia:
 *                       type: string
 *                     montoCentavos:
 *                       type: integer
 *                       example: 479600000
 *                     moneda:
 *                       type: string
 *                       example: COP
 *                     firma:
 *                       type: string
 *       400:
 *         description: Datos inválidos o producto inexistente
 *       409:
 *         description: No hay stock suficiente
 */
router.get('/', requiereAdmin, (req, res) => {
  const filtro = req.query.estadoPago ? String(req.query.estadoPago).split(',') : null;
  const pedidos = leerPedidos();
  res.json(filtro ? pedidos.filter((p) => filtro.includes(p.pago.estado)) : pedidos);
});

router.post('/', (req, res) => {
  const { items, metodoEnvio, cliente, usuario } = req.body ?? {};

  if (!(metodoEnvio in COSTOS_ENVIO)) return res.status(400).json({ error: 'metodoEnvio debe ser estandar o express' });
  const errorCliente = validarCliente(cliente);
  if (errorCliente) return res.status(400).json({ error: errorCliente });
  const { cantidades, error } = agruparItems(items);
  if (error) return res.status(400).json({ error });

  const catalogo = leerProductos();
  const itemsPedido = [];
  for (const [id, cantidad] of cantidades) {
    const producto = catalogo.find((p) => p.id === id);
    if (!producto) return res.status(400).json({ error: `El producto ${id} no existe` });
    if (producto.stock < cantidad) {
      return res.status(409).json({ error: `Solo quedan ${producto.stock} unidades de ${producto.nombre}` });
    }
    itemsPedido.push({ id, nombre: producto.nombre, imagen: producto.imagen, precio: producto.precio, cantidad });
  }

  const subtotal = itemsPedido.reduce((suma, item) => suma + item.precio * item.cantidad, 0);
  const costoEnvio = COSTOS_ENVIO[metodoEnvio];
  const total = Math.round(subtotal + costoEnvio);
  const montoCentavos = total * 100;

  const pedido = {
    referencia: generarReferencia(),
    fecha: new Date().toISOString(),
    cliente: {
      ...Object.fromEntries(CAMPOS_CLIENTE.map((campo) => [campo, cliente[campo].trim()])),
      notas: typeof cliente.notas === 'string' ? cliente.notas.trim() : '',
    },
    usuario: usuario && typeof usuario === 'object' ? { id: usuario.id, nombre: usuario.nombre, email: usuario.email } : null,
    metodoEnvio,
    items: itemsPedido,
    subtotal,
    costoEnvio,
    total,
    montoCentavos,
    pago: { estado: 'iniciado', transaccionId: null, verificadoEn: null },
    envio: { estado: 'revision', fecha: null },
    stockDescontado: false,
  };

  guardarPedidos([pedido, ...leerPedidos()]);
  res.status(201).json({
    pedido,
    pago: {
      referencia: pedido.referencia,
      montoCentavos,
      moneda: MONEDA,
      firma: firmaIntegridad(pedido.referencia, montoCentavos, MONEDA),
    },
  });
});

/**
 * @swagger
 * /api/pedidos/{referencia}:
 *   get:
 *     summary: Consulta un pedido por su referencia · solo administradores
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: referencia
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       401:
 *         description: Sin sesión o sesión vencida
 *       403:
 *         description: La sesión no es de administrador
 *       200:
 *         description: Pedido encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pedido'
 *       404:
 *         description: No existe un pedido con esa referencia
 */
router.get('/:referencia', requiereAdmin, (req, res) => {
  const pedido = leerPedidos().find((p) => p.referencia === req.params.referencia);
  if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
  res.json(pedido);
});

/**
 * @swagger
 * /api/pedidos/{referencia}/confirmar:
 *   post:
 *     summary: Verifica con Wompi el pago de un pedido y actualiza su estado
 *     description: >
 *       El backend consulta la transacción directamente a Wompi y comprueba que la
 *       referencia, el monto y la moneda coincidan con el pedido. Si el pago queda
 *       aprobado, descuenta el stock. Se puede volver a llamar para actualizar un pago pendiente.
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: referencia
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [transaccionId]
 *             properties:
 *               transaccionId:
 *                 type: string
 *                 description: ID de la transacción que devolvió el widget de Wompi
 *     responses:
 *       200:
 *         description: Pedido con el estado del pago verificado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pedido'
 *       400:
 *         description: La transacción no existe en Wompi o no corresponde al pedido
 *       404:
 *         description: No existe un pedido con esa referencia
 *       409:
 *         description: El pedido ya fue pagado con otra transacción
 *       502:
 *         description: No se pudo consultar a Wompi
 */
router.post('/:referencia/confirmar', async (req, res) => {
  const { transaccionId } = req.body ?? {};
  if (typeof transaccionId !== 'string' || !transaccionId) {
    return res.status(400).json({ error: 'Se requiere transaccionId' });
  }

  const pedidoActual = leerPedidos().find((p) => p.referencia === req.params.referencia);
  if (!pedidoActual) return res.status(404).json({ error: 'Pedido no encontrado' });
  if (pedidoActual.pago.estado === 'aprobado' && pedidoActual.pago.transaccionId !== transaccionId) {
    return res.status(409).json({ error: 'Este pedido ya fue pagado con otra transacción' });
  }

  let transaccion;
  try {
    transaccion = await consultarTransaccion(transaccionId);
  } catch (error) {
    return res.status(502).json({ error: `No se pudo verificar el pago con Wompi: ${error.message}` });
  }
  if (!transaccion) return res.status(400).json({ error: 'Wompi no tiene registrada esa transacción' });
  if (
    transaccion.reference !== pedidoActual.referencia ||
    transaccion.amount_in_cents !== pedidoActual.montoCentavos ||
    transaccion.currency !== MONEDA
  ) {
    return res.status(400).json({ error: 'La transacción de Wompi no corresponde a este pedido' });
  }

  // Se vuelve a leer después de esperar a Wompi para no pisar cambios hechos mientras tanto.
  const pedidos = leerPedidos();
  const pedido = pedidos.find((p) => p.referencia === pedidoActual.referencia);
  pedido.pago = {
    estado: ESTADOS_WOMPI[transaccion.status] ?? 'pendiente',
    transaccionId,
    verificadoEn: new Date().toISOString(),
  };
  if (pedido.pago.estado === 'aprobado' && !pedido.stockDescontado) descontarStock(pedido);

  guardarPedidos(pedidos);
  res.json(pedido);
});

/**
 * @swagger
 * /api/pedidos/{referencia}/envio:
 *   patch:
 *     summary: Cambia el estado de envío de un pedido pagado · solo administradores
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: referencia
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estado]
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [revision, enviado]
 *     responses:
 *       401:
 *         description: Sin sesión o sesión vencida
 *       403:
 *         description: La sesión no es de administrador
 *       200:
 *         description: Pedido actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pedido'
 *       400:
 *         description: Estado inválido
 *       404:
 *         description: No existe un pedido con esa referencia
 *       409:
 *         description: El pago del pedido no está aprobado
 */
router.patch('/:referencia/envio', requiereAdmin, (req, res) => {
  const { estado } = req.body ?? {};
  if (estado !== 'revision' && estado !== 'enviado') {
    return res.status(400).json({ error: 'estado debe ser revision o enviado' });
  }

  const pedidos = leerPedidos();
  const pedido = pedidos.find((p) => p.referencia === req.params.referencia);
  if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
  if (estado === 'enviado' && pedido.pago.estado !== 'aprobado') {
    return res.status(409).json({ error: 'Solo se pueden enviar pedidos con el pago aprobado' });
  }

  pedido.envio = { estado, fecha: estado === 'enviado' ? new Date().toISOString() : null };
  guardarPedidos(pedidos);
  res.json(pedido);
});

module.exports = router;
