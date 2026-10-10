require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();
app.use(cors());
app.use(express.json());

// Documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /api/wompi/firma:
 *   post:
 *     summary: Genera la firma de integridad para un pago con Wompi
 *     tags: [Wompi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [referencia, monto, moneda]
 *             properties:
 *               referencia:
 *                 type: string
 *                 description: ID único de la orden o pedido
 *                 example: pedido-12345
 *               monto:
 *                 type: integer
 *                 description: Monto en centavos (ej. $50.000 COP = 5000000)
 *                 example: 5000000
 *               moneda:
 *                 type: string
 *                 example: COP
 *     responses:
 *       200:
 *         description: Firma generada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 firma:
 *                   type: string
 *                   example: 3c6f1a...
 */
app.post('/api/wompi/firma', (req, res) => {
  const { referencia, monto, moneda } = req.body;

  const cadena = `${referencia}${monto}${moneda}${process.env.WOMPI_INTEGRITY_KEY}`;
  const firma = crypto.createHash('sha256').update(cadena).digest('hex');

  res.json({ firma });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});

