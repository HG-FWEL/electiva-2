const express = require('express');
const { leerUsuarios, guardarUsuarios } = require('../almacen');
const {
  usuarioPublico,
  crearToken,
  cifrarPassword,
  compararPassword,
  requiereSesion,
} = require('../auth');

const router = express.Router();

const LARGO_MINIMO_PASSWORD = 8;
// Hash cualquiera para comparar cuando el correo no existe: así la respuesta
// tarda lo mismo y no delata qué correos están registrados.
const HASH_FICTICIO = require('bcryptjs').hashSync('cuenta-inexistente', 10);

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Token que devuelve /api/auth/login (dura 8 horas)
 *   schemas:
 *     Usuario:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: user-1760000000000
 *         nombre:
 *           type: string
 *           example: Ana Pérez
 *         email:
 *           type: string
 *           example: ana@correo.com
 *         rol:
 *           type: string
 *           enum: [cliente, admin]
 *     Sesion:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: JWT para enviar en "Authorization: Bearer <token>"
 *         usuario:
 *           $ref: '#/components/schemas/Usuario'
 */

/**
 * @swagger
 * /api/auth/registro:
 *   post:
 *     summary: Crea una cuenta de cliente e inicia sesión
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email, password]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Ana Pérez
 *               email:
 *                 type: string
 *                 example: ana@correo.com
 *               password:
 *                 type: string
 *                 description: Mínimo 8 caracteres
 *                 example: claveSegura123
 *     responses:
 *       201:
 *         description: Cuenta creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sesion'
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Ya existe una cuenta con ese correo
 */
router.post('/registro', async (req, res) => {
  const { nombre, email, password } = req.body ?? {};
  if (typeof nombre !== 'string' || nombre.trim().length < 2) {
    return res.status(400).json({ error: 'Ingresa tu nombre completo' });
  }
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Ingresa un correo válido' });
  }
  if (typeof password !== 'string' || password.length < LARGO_MINIMO_PASSWORD) {
    return res.status(400).json({ error: `La contraseña debe tener al menos ${LARGO_MINIMO_PASSWORD} caracteres` });
  }

  const emailNormalizado = email.trim().toLowerCase();
  const usuarios = leerUsuarios();
  if (usuarios.some((u) => u.email === emailNormalizado)) {
    return res.status(409).json({ error: 'Ya existe una cuenta registrada con ese correo' });
  }

  const usuario = {
    id: `user-${Date.now()}`,
    nombre: nombre.trim(),
    email: emailNormalizado,
    passwordHash: await cifrarPassword(password),
    rol: 'cliente',
    creado: new Date().toISOString(),
  };
  guardarUsuarios([...leerUsuarios(), usuario]);
  res.status(201).json({ token: crearToken(usuario), usuario: usuarioPublico(usuario) });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Inicia sesión y devuelve un token
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@movimarket.com
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sesión iniciada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sesion'
 *       400:
 *         description: Faltan datos
 *       401:
 *         description: Correo o contraseña incorrectos
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ error: 'Ingresa tu correo y tu contraseña' });
  }

  const usuario = leerUsuarios().find((u) => u.email === email.trim().toLowerCase());
  const coincide = await compararPassword(password, usuario?.passwordHash ?? HASH_FICTICIO);
  // Mismo mensaje para correo inexistente y contraseña errada.
  if (!usuario || !coincide) return res.status(401).json({ error: 'Correo o contraseña incorrectos' });

  res.json({ token: crearToken(usuario), usuario: usuarioPublico(usuario) });
});

/**
 * @swagger
 * /api/auth/yo:
 *   get:
 *     summary: Devuelve el usuario de la sesión actual
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuario de la sesión
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: Sin sesión o sesión vencida
 */
router.get('/yo', requiereSesion, (req, res) => {
  res.json(req.usuario);
});

module.exports = router;
