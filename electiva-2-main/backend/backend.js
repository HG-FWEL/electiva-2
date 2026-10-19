require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const rutasProductos = require('./rutas/productos');
const rutasPedidos = require('./rutas/pedidos');
const { router: rutasImagenes, DIR_UPLOADS } = require('./rutas/imagenes');
const rutasAuth = require('./rutas/auth');
const { asegurarAdmin } = require('./auth');

// Sin clave para firmar los tokens no hay sesiones seguras: mejor no arrancar.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('Falta JWT_SECRET en backend/.env (mínimo 32 caracteres). El servidor no puede arrancar.');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// Documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', rutasAuth);
app.use('/api/productos', rutasProductos);
app.use('/api/pedidos', rutasPedidos);
app.use('/api/imagenes', rutasImagenes);
app.use('/uploads', express.static(DIR_UPLOADS));

// Cualquier error no controlado se responde como JSON (igual que el resto de la API).
// Express reconoce el manejador de errores porque recibe 4 parámetros.
app.use((error, req, res, next) => {
  console.error(error);
  const status = error.status || error.statusCode || 500;
  res.status(status).json({ error: status === 500 ? 'Error interno del servidor' : error.message });
});

const PORT = process.env.PORT || 4000;
asegurarAdmin().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
  });
});
