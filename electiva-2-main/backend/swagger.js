const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de MóvilMarket',
      version: '2.0.0',
      description:
        'Catálogo de productos y pedidos de la tienda. Los pedidos se cobran con Wompi: ' +
        'el backend calcula el total, firma el pago y verifica la transacción con Wompi.',
    },
    servers: [{ url: 'http://localhost:4000' }],
    tags: [
      { name: 'Autenticación', description: 'Registro e inicio de sesión. Usa el botón Authorize con el token para probar las rutas de administrador.' },
      { name: 'Productos', description: 'Catálogo de la tienda' },
      { name: 'Pedidos', description: 'Compras de los clientes y su pago con Wompi' },
    ],
  },
  apis: ['auth.js', 'productos.js', 'imagenes.js', 'pedidos.js'].map((archivo) => path.join(__dirname, 'rutas', archivo)),
};

module.exports = swaggerJSDoc(options);
