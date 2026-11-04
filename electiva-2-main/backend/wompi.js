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

// Busca las transacciones de un pedido por su referencia (necesita la llave
// privada). Con PSE, Nequi o Bancolombia el widget a veces no devuelve la
// transacción, así que esta es la forma de saber si el cliente pagó.
// Prefiere la aprobada, luego la pendiente y si no, la más reciente.
async function buscarTransaccionPorReferencia(referencia) {
  if (!process.env.WOMPI_PRIVATE_KEY) throw new Error('Falta WOMPI_PRIVATE_KEY en .env');
  const respuesta = await fetch(`${WOMPI_API_URL}/transactions?reference=${encodeURIComponent(referencia)}`, {
    headers: { Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}` },
  });
  if (!respuesta.ok) throw new Error(`Wompi respondió ${respuesta.status} al buscar el pago`);
  const { data = [] } = await respuesta.json();
  const transacciones = data
    .filter((t) => t.reference === referencia)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return (
    transacciones.find((t) => t.status === 'APPROVED') ??
    transacciones.find((t) => t.status === 'PENDING') ??
    transacciones[0] ??
    null
  );
}

module.exports = { ESTADOS_WOMPI, firmaIntegridad, consultarTransaccion, buscarTransaccionPorReferencia };
