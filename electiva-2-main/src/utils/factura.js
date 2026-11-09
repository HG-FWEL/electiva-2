// src/utils/factura.js
// Genera y descarga la factura de un pedido en PDF, en el navegador.
// jsPDF se carga solo al pedir una factura, para no hacer más pesada la tienda.
//
// Es un comprobante de la tienda: no reemplaza la factura electrónica de la DIAN.
import { formatPrecioCOP } from './precio';

const TIENDA = {
  nombre: 'MóvilMarket',
  descripcion: 'Tienda de tecnología y telefonía',
  web: 'movimarket-tienda.onrender.com',
};

const COLOR_OSCURO = [15, 23, 42];
const COLOR_MARCA = [0, 168, 132];
const COLOR_SUAVE = [100, 116, 139];
const COLOR_BORDE = [226, 232, 240];

// Las fuentes estándar del PDF no tienen los espacios finos que usa toLocaleString.
const limpiar = (texto) => String(texto ?? '').replace(/[  ]/g, ' ');
const precio = (valor) => limpiar(formatPrecioCOP(valor));

const SIGLAS_DOCUMENTO = { CC: 'C.C.', CE: 'C.E.', NIT: 'NIT', PP: 'Pasaporte', TI: 'T.I.' };

// "C.C. 1077123456"; los pedidos de antes de pedir el documento no lo tienen.
function documentoDe(cliente) {
  if (!cliente?.numeroDocumento) return '';
  const sigla = SIGLAS_DOCUMENTO[cliente.tipoDocumento] ?? cliente.tipoDocumento ?? '';
  return `${sigla} ${cliente.numeroDocumento}`.trim();
}

function fecha(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * pedido: { referencia, fecha, items[{ nombre, cantidad, precio }], subtotal, costoEnvio, total,
 *           metodoEnvio, clienteId, cliente{ nombre, tipoDocumento, numeroDocumento, email, telefono,
 *           direccion?, ciudad? },
 *           direccion?{ direccion, ciudad }, pago{ transaccionId, fecha? / verificadoEn? } }
 * Sirve tanto para "Mis pedidos" como para el panel de administración.
 */
export async function descargarFactura(pedido) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();
  const margen = 18;
  const derecha = ancho - margen;

  const direccion = pedido.direccion?.direccion ?? pedido.cliente?.direccion ?? '';
  const ciudad = pedido.direccion?.ciudad ?? pedido.cliente?.ciudad ?? '';
  const fechaPago = pedido.pago?.fecha ?? pedido.pago?.verificadoEn ?? pedido.fecha;

  // --- Encabezado ---
  doc.setFillColor(...COLOR_OSCURO);
  doc.rect(0, 0, ancho, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(TIENDA.nombre, margen, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${TIENDA.descripcion} · ${TIENDA.web}`, margen, 23);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('FACTURA DE VENTA', derecha, 16, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`N.° ${pedido.referencia}`, derecha, 23, { align: 'right' });

  // --- Datos de la factura y del cliente ---
  let y = 46;
  doc.setTextColor(...COLOR_SUAVE);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURADO A', margen, y);
  doc.text('DETALLES', ancho / 2 + 5, y);

  doc.setTextColor(...COLOR_OSCURO);
  doc.setFontSize(10);
  const columnaCliente = [
    limpiar(pedido.cliente?.nombre),
    limpiar(documentoDe(pedido.cliente)),
    pedido.clienteId ? `Cliente N.° ${pedido.clienteId}` : '',
    limpiar(pedido.cliente?.email),
    pedido.cliente?.telefono ? `Tel. ${limpiar(pedido.cliente.telefono)}` : '',
    limpiar([direccion, ciudad].filter(Boolean).join(', ')),
  ].filter(Boolean);
  const columnaDetalles = [
    ['Fecha del pedido', fecha(pedido.fecha)],
    ['Fecha de pago', fecha(fechaPago)],
    ['Medio de pago', 'Wompi'],
    ['Transacción', limpiar(pedido.pago?.transaccionId ?? '—')],
    ['Envío', pedido.metodoEnvio === 'express' ? 'Express (24-48 h)' : 'Estándar (3-5 días)'],
  ];

  let yCliente = y + 6;
  columnaCliente.forEach((linea, i) => {
    doc.setFont('helvetica', i === 0 ? 'bold' : 'normal');
    const partes = doc.splitTextToSize(linea, ancho / 2 - margen - 5);
    doc.text(partes, margen, yCliente);
    yCliente += partes.length * 5;
  });

  let yDetalles = y + 6;
  columnaDetalles.forEach(([etiqueta, valor]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_SUAVE);
    doc.text(etiqueta, ancho / 2 + 5, yDetalles);
    doc.setTextColor(...COLOR_OSCURO);
    doc.text(valor, derecha, yDetalles, { align: 'right' });
    yDetalles += 5;
  });

  // --- Tabla de productos ---
  y = Math.max(yCliente, yDetalles) + 8;
  const columnas = { producto: margen + 3, cantidad: ancho - 92, unitario: ancho - 52, total: derecha - 3 };

  const encabezadoTabla = () => {
    doc.setFillColor(241, 245, 249);
    doc.rect(margen, y - 5, derecha - margen, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_SUAVE);
    doc.text('PRODUCTO', columnas.producto, y);
    doc.text('CANT.', columnas.cantidad, y, { align: 'center' });
    doc.text('PRECIO UNIT.', columnas.unitario, y, { align: 'right' });
    doc.text('TOTAL', columnas.total, y, { align: 'right' });
    y += 9;
  };
  encabezadoTabla();

  doc.setFontSize(10);
  for (const item of pedido.items) {
    const nombre = doc.splitTextToSize(limpiar(item.nombre), columnas.cantidad - columnas.producto - 12);
    const altoFila = nombre.length * 5 + 3;
    if (y + altoFila > alto - 60) {
      doc.addPage();
      y = margen + 5;
      encabezadoTabla();
      doc.setFontSize(10);
    }
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_OSCURO);
    doc.text(nombre, columnas.producto, y);
    doc.text(String(item.cantidad), columnas.cantidad, y, { align: 'center' });
    doc.text(precio(item.precio), columnas.unitario, y, { align: 'right' });
    doc.text(precio(item.precio * item.cantidad), columnas.total, y, { align: 'right' });
    y += altoFila;
    doc.setDrawColor(...COLOR_BORDE);
    doc.line(margen, y - 3, derecha, y - 3);
    y += 2;
  }

  // --- Totales ---
  y += 4;
  const filaTotal = (etiqueta, valor, destacado = false) => {
    doc.setFont('helvetica', destacado ? 'bold' : 'normal');
    doc.setFontSize(destacado ? 12 : 10);
    doc.setTextColor(...(destacado ? COLOR_OSCURO : COLOR_SUAVE));
    doc.text(etiqueta, columnas.unitario, y, { align: 'right' });
    doc.setTextColor(...COLOR_OSCURO);
    doc.text(valor, columnas.total, y, { align: 'right' });
    y += destacado ? 8 : 6;
  };
  filaTotal('Subtotal', precio(pedido.subtotal));
  filaTotal('Envío', pedido.costoEnvio > 0 ? precio(pedido.costoEnvio) : 'Gratis');
  doc.setDrawColor(...COLOR_MARCA);
  doc.setLineWidth(0.6);
  doc.line(columnas.unitario - 30, y - 3, derecha, y - 3);
  doc.setLineWidth(0.2);
  y += 2;
  filaTotal('TOTAL PAGADO', precio(pedido.total), true);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_SUAVE);
  doc.text('Valores en pesos colombianos (COP).', margen, y);

  // --- Pie ---
  doc.setFontSize(8);
  doc.text(
    doc.splitTextToSize(
      'Gracias por comprar en MóvilMarket. Este documento es un comprobante de compra generado por la tienda ' +
        'y no reemplaza la factura electrónica de la DIAN.',
      derecha - margen
    ),
    margen,
    alto - 16
  );

  doc.save(`Factura-${pedido.referencia}.pdf`);
}
