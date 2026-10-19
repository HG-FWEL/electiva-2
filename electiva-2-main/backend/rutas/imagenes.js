const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');

const { requiereAdmin } = require('../auth');

const router = express.Router();

const DIR_UPLOADS = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(DIR_UPLOADS, { recursive: true });

const TIPOS_PERMITIDOS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const TAMANO_MAXIMO = 5 * 1024 * 1024; // 5 MB

const subida = multer({
  storage: multer.diskStorage({
    destination: DIR_UPLOADS,
    // Nombre aleatorio: evita choques y que el nombre original llegue al disco.
    filename: (req, archivo, cb) => cb(null, `${crypto.randomUUID()}${TIPOS_PERMITIDOS[archivo.mimetype]}`),
  }),
  limits: { fileSize: TAMANO_MAXIMO, files: 1 },
  fileFilter: (req, archivo, cb) => cb(null, archivo.mimetype in TIPOS_PERMITIDOS),
}).single('imagen');

/**
 * @swagger
 * /api/imagenes:
 *   post:
 *     summary: Sube la imagen de un producto · solo administradores
 *     description: Acepta JPG, PNG o WebP de hasta 5 MB. Devuelve la URL pública para usar en el campo imagen del producto.
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [imagen]
 *             properties:
 *               imagen:
 *                 type: string
 *                 format: binary
 *     responses:
 *       401:
 *         description: Sin sesión o sesión vencida
 *       403:
 *         description: La sesión no es de administrador
 *       201:
 *         description: Imagen guardada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: http://localhost:4000/uploads/3f2b9c1e-....jpg
 *       400:
 *         description: No se envió una imagen JPG, PNG o WebP
 *       413:
 *         description: La imagen pesa más de 5 MB
 */
router.post('/', requiereAdmin, (req, res) => {
  subida(req, res, (error) => {
    if (error?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'La imagen no puede pesar más de 5 MB' });
    if (error) return res.status(400).json({ error: `No se pudo subir la imagen: ${error.message}` });
    if (!req.file) return res.status(400).json({ error: 'Envía una imagen JPG, PNG o WebP en el campo "imagen"' });

    res.status(201).json({ url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` });
  });
});

module.exports = { router, DIR_UPLOADS };
