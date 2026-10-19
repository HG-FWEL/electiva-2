const express = require('express');
const { leerProductos, guardarProductos } = require('../almacen');

const { requiereAdmin } = require('../auth');

const router = express.Router();

const CAMPOS_TEXTO = ['nombre', 'categoria', 'marca', 'linea', 'especificaciones', 'descripcion', 'imagen', 'modelo3d'];

// Toma del body solo los campos conocidos (ignora cualquier otro, como el id).
function camposPermitidos(body) {
  const campos = {};
  for (const campo of CAMPOS_TEXTO) {
    if (body[campo] !== undefined) campos[campo] = typeof body[campo] === 'string' ? body[campo].trim() : body[campo];
  }
  if (body.precio !== undefined) campos.precio = body.precio;
  if (body.stock !== undefined) campos.stock = body.stock;
  return campos;
}

function validarProducto(producto) {
  if (typeof producto.nombre !== 'string' || !producto.nombre) return 'El nombre es obligatorio';
  if (typeof producto.categoria !== 'string' || !producto.categoria) return 'La categoría es obligatoria';
  if (typeof producto.precio !== 'number' || !Number.isFinite(producto.precio) || producto.precio < 0) {
    return 'El precio debe ser un número mayor o igual a 0 (en pesos colombianos)';
  }
  if (!Number.isInteger(producto.stock) || producto.stock < 0) return 'El stock debe ser un entero mayor o igual a 0';
  if (typeof producto.imagen !== 'string' || !producto.imagen) return 'La URL de la imagen es obligatoria';
  for (const campo of CAMPOS_TEXTO) {
    if (producto[campo] !== undefined && typeof producto[campo] !== 'string') return `El campo ${campo} debe ser texto`;
  }
  return null;
}

// Los campos de texto opcionales que llegan vacíos se eliminan del producto.
function limpiarVacios(producto) {
  return Object.fromEntries(Object.entries(producto).filter(([, valor]) => valor !== '' && valor !== undefined));
}

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductoEntrada:
 *       type: object
 *       required: [nombre, categoria, precio, stock, imagen]
 *       properties:
 *         nombre:
 *           type: string
 *           example: iPhone 15 Pro Max
 *         categoria:
 *           type: string
 *           description: Slug de la categoría
 *           example: celulares
 *         marca:
 *           type: string
 *           example: Apple
 *         linea:
 *           type: string
 *         especificaciones:
 *           type: string
 *           example: Titanio Natural · 256GB · Chip A17 Pro
 *         descripcion:
 *           type: string
 *         precio:
 *           type: number
 *           description: Precio en pesos colombianos
 *           example: 4796000
 *         stock:
 *           type: integer
 *           example: 18
 *         imagen:
 *           type: string
 *           example: https://images.unsplash.com/photo-1511707171634-5f897ff02aa9
 *         modelo3d:
 *           type: string
 *           example: /models/iphone-15/iphone15.fbx
 *     Producto:
 *       allOf:
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *               example: cel-1
 *         - $ref: '#/components/schemas/ProductoEntrada'
 */

/**
 * @swagger
 * /api/productos:
 *   get:
 *     summary: Lista el catálogo completo
 *     tags: [Productos]
 *     responses:
 *       200:
 *         description: Productos de la tienda
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Producto'
 *   post:
 *     summary: Crea un producto · solo administradores
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductoEntrada'
 *     responses:
 *       401:
 *         description: Sin sesión o sesión vencida
 *       403:
 *         description: La sesión no es de administrador
 *       201:
 *         description: Producto creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Producto'
 *       400:
 *         description: Datos inválidos
 */
router.get('/', (req, res) => {
  res.json(leerProductos());
});

router.post('/', requiereAdmin, (req, res) => {
  const producto = limpiarVacios({ id: `prod-${Date.now()}`, ...camposPermitidos(req.body ?? {}) });
  const error = validarProducto(producto);
  if (error) return res.status(400).json({ error });

  guardarProductos([...leerProductos(), producto]);
  res.status(201).json(producto);
});

/**
 * @swagger
 * /api/productos/{id}:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *       example: cel-1
 *   get:
 *     summary: Consulta un producto
 *     tags: [Productos]
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Producto'
 *       404:
 *         description: No existe un producto con ese id
 *   put:
 *     summary: Actualiza un producto (solo cambia los campos que se envían) · solo administradores
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               precio: 4500000
 *               stock: 10
 *     responses:
 *       401:
 *         description: Sin sesión o sesión vencida
 *       403:
 *         description: La sesión no es de administrador
 *       200:
 *         description: Producto actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Producto'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: No existe un producto con ese id
 *   delete:
 *     summary: Elimina un producto · solo administradores
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       401:
 *         description: Sin sesión o sesión vencida
 *       403:
 *         description: La sesión no es de administrador
 *       204:
 *         description: Producto eliminado
 *       404:
 *         description: No existe un producto con ese id
 */
router.get('/:id', (req, res) => {
  const producto = leerProductos().find((p) => p.id === req.params.id);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(producto);
});

router.put('/:id', requiereAdmin, (req, res) => {
  const productos = leerProductos();
  const indice = productos.findIndex((p) => p.id === req.params.id);
  if (indice === -1) return res.status(404).json({ error: 'Producto no encontrado' });

  const actualizado = limpiarVacios({ ...productos[indice], ...camposPermitidos(req.body ?? {}) });
  const error = validarProducto(actualizado);
  if (error) return res.status(400).json({ error });

  productos[indice] = actualizado;
  guardarProductos(productos);
  res.json(actualizado);
});

router.delete('/:id', requiereAdmin, (req, res) => {
  const productos = leerProductos();
  if (!productos.some((p) => p.id === req.params.id)) return res.status(404).json({ error: 'Producto no encontrado' });

  guardarProductos(productos.filter((p) => p.id !== req.params.id));
  res.status(204).end();
});

module.exports = router;
