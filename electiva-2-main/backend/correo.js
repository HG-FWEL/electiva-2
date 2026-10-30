// Correos a los clientes por Gmail: confirmación de pedido y pedido enviado.
// Se envían en segundo plano: si Gmail falla, el pago o el panel siguen
// funcionando y el error solo queda en la consola.
const nodemailer = require('nodemailer');

const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
const activo = Boolean(GMAIL_USER && GMAIL_APP_PASSWORD);
if (!activo) {
  console.warn('Aviso: sin GMAIL_USER/GMAIL_APP_PASSWORD en .env los correos a clientes están desactivados.');
}

const transporte = activo
  ? nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD } })
  : null;

const NOMBRES_ENVIO = { estandar: 'Estándar (gratis)', express: 'Express' };

function formatoCOP(valor) {
  return Math.round(Number(valor)).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });
}

// Los datos del cliente y de los productos van dentro del HTML: se escapan.
function escapar(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function plantillaHtml(titulo, contenido) {
  return `<!doctype html>
<html lang="es"><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#1e293b">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px">
    <div style="background:#0f172a;color:#ffffff;border-radius:16px 16px 0 0;padding:20px 24px">
      <div style="font-size:20px;font-weight:bold">MóvilMarket</div>
      <div style="font-size:15px;margin-top:4px;color:#cbd5e1">${escapar(titulo)}</div>
    </div>
    <div style="background:#ffffff;border-radius:0 0 16px 16px;padding:24px">${contenido}</div>
    <p style="font-size:12px;color:#64748b;text-align:center;margin-top:16px">
      Recibes este correo porque hiciste una compra en MóvilMarket.
    </p>
  </div>
</body></html>`;
}

function direccionDe(pedido) {
  return `${pedido.cliente.direccion}, ${pedido.cliente.ciudad}`;
}

function correoConfirmacion(pedido) {
  const nombre = pedido.cliente.nombre;
  const filas = pedido.items
    .map(
      (item) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0">${escapar(item.nombre)} × ${item.cantidad}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:right">${formatoCOP(item.precio * item.cantidad)}</td>
      </tr>`
    )
    .join('');

  const html = plantillaHtml(
    'Confirmamos tu pedido',
    `<p>Hola ${escapar(nombre)}, recibimos tu pago. Estamos preparando tu pedido.</p>
    <p style="margin:0 0 16px"><strong>Referencia:</strong> ${escapar(pedido.referencia)}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${filas}
      <tr><td style="padding:8px 0">Subtotal</td><td style="text-align:right">${formatoCOP(pedido.subtotal)}</td></tr>
      <tr><td style="padding:4px 0">Envío ${escapar(NOMBRES_ENVIO[pedido.metodoEnvio] ?? '')}</td>
          <td style="text-align:right">${pedido.costoEnvio > 0 ? formatoCOP(pedido.costoEnvio) : 'Gratis'}</td></tr>
      <tr><td style="padding:8px 0;font-weight:bold">Total</td>
          <td style="text-align:right;font-weight:bold">${formatoCOP(pedido.total)}</td></tr>
    </table>
    <p style="margin-top:16px"><strong>Se enviará a:</strong><br>${escapar(direccionDe(pedido))}</p>
    <p>Te escribiremos de nuevo cuando tu pedido salga hacia tu dirección.</p>`
  );

  const texto = [
    `Hola ${nombre}, recibimos tu pago. Estamos preparando tu pedido.`,
    '',
    `Referencia: ${pedido.referencia}`,
    '',
    ...pedido.items.map((item) => `- ${item.nombre} x ${item.cantidad}: ${formatoCOP(item.precio * item.cantidad)}`),
    '',
    `Subtotal: ${formatoCOP(pedido.subtotal)}`,
    `Envío: ${pedido.costoEnvio > 0 ? formatoCOP(pedido.costoEnvio) : 'Gratis'}`,
    `Total: ${formatoCOP(pedido.total)}`,
    '',
    `Se enviará a: ${direccionDe(pedido)}`,
    '',
    'Te escribiremos de nuevo cuando tu pedido salga hacia tu dirección.',
    '— MóvilMarket',
  ].join('\n');

  return { asunto: `Confirmamos tu pedido ${pedido.referencia}`, html, texto };
}

function correoEnviado(pedido) {
  const nombre = pedido.cliente.nombre;
  const html = plantillaHtml(
    'Tu pedido va en camino',
    `<p>Hola ${escapar(nombre)}, tu pedido <strong>${escapar(pedido.referencia)}</strong> ya salió hacia tu dirección.</p>
    <p><strong>Dirección de entrega:</strong><br>${escapar(direccionDe(pedido))}</p>
    <p>Gracias por comprar en MóvilMarket.</p>`
  );
  const texto = [
    `Hola ${nombre}, tu pedido ${pedido.referencia} ya salió hacia tu dirección.`,
    '',
    `Dirección de entrega: ${direccionDe(pedido)}`,
    '',
    'Gracias por comprar en MóvilMarket.',
  ].join('\n');
  return { asunto: `Tu pedido ${pedido.referencia} va en camino`, html, texto };
}

async function enviar(para, { asunto, html, texto }) {
  await transporte.sendMail({
    from: `"MóvilMarket" <${GMAIL_USER}>`,
    to: para,
    subject: asunto,
    text: texto,
    html,
  });
}

// Envía sin hacer esperar a quien llamó; un fallo se anota y no se propaga.
function enviarEnSegundoPlano(pedido, armarCorreo) {
  if (!activo || !pedido?.cliente?.email) return;
  enviar(pedido.cliente.email, armarCorreo(pedido)).catch((error) => {
    console.error(`No se pudo enviar el correo del pedido ${pedido.referencia}: ${error.message}`);
  });
}

module.exports = {
  avisarPedidoConfirmado: (pedido) => enviarEnSegundoPlano(pedido, correoConfirmacion),
  avisarPedidoEnviado: (pedido) => enviarEnSegundoPlano(pedido, correoEnviado),
  // Para la prueba manual de las plantillas.
  correoConfirmacion,
  correoEnviado,
  enviar,
};
