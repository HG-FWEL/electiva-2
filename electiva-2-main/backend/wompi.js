// Integración con Wompi: firma de integridad y consulta de transacciones.
const crypto = require('crypto');

// Sandbox por defecto (llaves pub_test_/prv_test_). En producción se cambia a
// https://production.wompi.co/v1 con la variable WOMPI_API_URL.
const WOMPI_API_URL = process.env.WOMPI_API_URL || 'https://sandbox.wompi.co/v1';

const ESTADOS_WOMPI = {
  APPROVED: 'aprobado',
  PENDING: 'pendiente',
  DECLINED: 'rechazado',
  VOIDED: 'rechazado',
  ERROR: 'rechazado',
};

function firmaIntegridad(referencia, montoCentavos, moneda) {
  const cadena = `${referencia}${montoCentavos}${moneda}${process.env.WOMPI_INTEGRITY_KEY}`;
  return crypto.createHash('sha256').update(cadena).digest('hex');
}

// Devuelve la transacción tal como la reporta Wompi, o null si no existe.
async function consultarTransaccion(transaccionId) {
  const respuesta = await fetch(`${WOMPI_API_URL}/transactions/${encodeURIComponent(transaccionId)}`);
  if (respuesta.status === 404) return null;
  if (!respuesta.ok) throw new Error(`Wompi respondió ${respuesta.status} al consultar la transacción`);
  const { data } = await respuesta.json();
  return data;
}

module.exports = { ESTADOS_WOMPI, firmaIntegridad, consultarTransaccion };
