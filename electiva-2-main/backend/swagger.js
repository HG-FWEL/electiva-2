const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de pagos Wompi',
      version: '1.0.0',
      description: 'Backend para generar la firma de integridad de Wompi',
    },
    servers: [{ url: 'http://localhost:4000' }],
  },
  apis: ['./backend.js'],
};

module.exports = swaggerJSDoc(options);