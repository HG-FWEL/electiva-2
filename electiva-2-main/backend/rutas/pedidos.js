const express = require('express');
const {
  buscarUsuarioPorEmail,
  crearUsuario,
  listarPedidos,
  obtenerPedido,
  crearPedido,
  registrarPago,
  cambiarEstadoEnvio,
} = require('../almacen');
const { ESTADOS_WOMPI, firmaIntegridad, consultarTransaccion } = require('../wompi');
const { avisarPedidoConfirmado, avisarPedidoEnviado } = require('../correo');

const { requiereAdmin, sesionOpcional } = require('../auth');

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

// Todo pedido pertenece a un usuario (así lo exige la tabla pedidos). Quien
// compra sin sesión queda con una cuenta de invitado por su correo, que luego
// puede activar registrándose con ese mismo correo.
async function usuarioDelPedido(sesion, cliente) {
  if (sesion) return sesion.id;
  const email = cliente.email.trim().toLowerCase();
  const existente = await buscarUsuarioPorEmail(email);
  if (existente) return existente.id;
  const invitado = await crearUsuario({ nombre: cliente.nombre.trim(), email, passwordHash: null });
  return invitado.id;
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
router.get('/', requiereAdmin, async (req, res) => {
  const filtro = req.query.estadoPago ? String(req.query.estadoPago).split(',') : null;
  const pedidos = await listarPedidos();
  res.json(filtro ? pedidos.filter((p) => filtro.includes(p.pago.estado)) : pedidos);
});

router.post('/', sesionOpcional, async (req, res) => {
  const { items, metodoEnvio, cliente } = req.body ?? {};

  if (!(metodoEnvio in COSTOS_ENVIO)) return res.status(400).json({ error: 'metodoEnvio debe ser estandar o express' });
  const errorCliente = validarCliente(cliente);
  if (errorCliente) return res.status(400).json({ error: errorCliente });
  const { cantidades, error } = agruparItems(items);
  if (error) return res.status(400).json({ error });

  // La base de datos toma los precios de su catálogo y revisa el stock
  // (responde 400 si un producto no existe y 409 si no alcanza el stock).
  const pedido = await crearPedido({
    referencia: generarReferencia(),
    usuarioId: await usuarioDelPedido(req.usuario, cliente),
    cliente: {
      ...Object.fromEntries(CAMPOS_CLIENTE.map((campo) => [campo, cliente[campo].trim()])),
      notas: typeof cliente.notas === 'string' ? cliente.notas.trim() : '',
    },
    usuario: req.usuario ? { id: req.usuario.id, nombre: req.usuario.nombre, email: req.usuario.email } : null,
    metodoEnvio,
    costoEnvio: COSTOS_ENVIO[metodoEnvio],
    items: [...cantidades].map(([id, cantidad]) => ({ id, cantidad })),
  });

  res.status(201).json({
    pedido,
    pago: {
      referencia: pedido.referencia,
      montoCentavos: pedido.montoCentavos,
      moneda: MONEDA,
      firma: firmaIntegridad(pedido.referencia, pedido.montoCentavos, MONEDA),
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
router.get('/:referencia', requiereAdmin, async (req, res) => {
  const pedido = await obtenerPedido(req.params.referencia);
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

  const pedidoActual = await obtenerPedido(req.params.referencia);
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

  // La función SQL bloquea el pedido mientras guarda el pago, así dos
  // confirmaciones simultáneas no descuentan el stock dos veces.
  const pedido = await registrarPago(pedidoActual.referencia, {
    transaccionId,
    estado: ESTADOS_WOMPI[transaccion.status] ?? 'pendiente',
    respuesta: { estadoWompi: transaccion.status, metodo: transaccion.payment_method_type ?? null },
  });
  // Solo la primera vez que el pago queda aprobado: verificar de nuevo no repite el correo.
  if (pedidoActual.pago.estado !== 'aprobado' && pedido.pago.estado === 'aprobado') avisarPedidoConfirmado(pedido);
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
router.patch('/:referencia/envio', requiereAdmin, async (req, res) => {
  const { estado } = req.body ?? {};
  if (estado !== 'revision' && estado !== 'enviado') {
    return res.status(400).json({ error: 'estado debe ser revision o enviado' });
  }

  const pedido = await obtenerPedido(req.params.referencia);
  if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
  // La tabla pedidos solo admite "pagado"/"enviado" con un pago aprobado.
  if (pedido.pago.estado !== 'aprobado') {
    return res.status(409).json({ error: 'Solo se pueden gestionar envíos de pedidos con el pago aprobado' });
  }

  const actualizado = await cambiarEstadoEnvio(pedido.referencia, estado);
  // Solo al pasar a "enviado": marcarlo de nuevo no repite el correo.
  if (pedido.envio.estado !== 'enviado' && actualizado.envio.estado === 'enviado') avisarPedidoEnviado(actualizado);
  res.json(actualizado);
});

module.exports = router;
