// src/pages/Checkout.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useProductos } from '../context/ProductosContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { handleImgError } from '../utils/placeholder';
import { formatPrecioCOP } from '../utils/precio';
import { avisoItemCarrito } from '../utils/carrito';
import { pedirApi } from '../utils/api';
import SelectorCantidad from '../components/SelectorCantidad';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faHourglassHalf, faCartShopping, faLock, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import './Checkout.css';

// Solo para mostrar el resumen: el backend cobra sus propios valores
// (COSTOS_ENVIO en backend/rutas/pedidos.js) y precios de su catálogo.
const METODOS_ENVIO = [
  { valor: 'estandar', nombre: 'Estándar', tiempo: 'Llega en 3 a 5 días hábiles', costo: 0 },
  { valor: 'express', nombre: 'Express', tiempo: 'Llega en 24 a 48 horas', costo: 60000 },
];

const WOMPI_PUBLIC_KEY = import.meta.env.VITE_WOMPI_PUBLIC_KEY;
const MODO_PRUEBAS = WOMPI_PUBLIC_KEY?.startsWith('pub_test_');

// Teléfono, dirección y ciudad de la última compra, para no volver a escribirlos.
const DATOS_ENVIO_KEY = 'movimarket_datos_envio';

function leerDatosEnvio() {
  try {
    return JSON.parse(window.localStorage.getItem(DATOS_ENVIO_KEY)) || {};
  } catch {
    return {};
  }
}

function guardarDatosEnvio({ telefono, direccion, ciudad }) {
  try {
    window.localStorage.setItem(DATOS_ENVIO_KEY, JSON.stringify({ telefono, direccion, ciudad }));
  } catch {
    // Si el navegador no deja guardar, simplemente no se recuerdan.
  }
}

function validarDatos(datos) {
  const errores = {};
  if (!datos.nombre.trim()) errores.nombre = 'Ingresa tu nombre completo';
  if (!/^\S+@\S+\.\S+$/.test(datos.email.trim())) errores.email = 'Ingresa un correo válido';
  if (datos.telefono.replace(/\D/g, '').length < 7) errores.telefono = 'Ingresa un teléfono de al menos 7 dígitos';
  if (!datos.direccion.trim()) errores.direccion = 'Ingresa tu dirección de envío';
  if (!datos.ciudad.trim()) errores.ciudad = 'Ingresa tu ciudad';
  return errores;
}

// Abre el widget de Wompi con el monto y la firma que calculó el backend.
// Wompi llama a onTransaccion solo cuando la transacción termina; si el usuario
// cierra el widget sin pagar no hay callback.
function abrirWidgetWompi(pago, datos, onTransaccion) {
  const checkout = new window.WidgetCheckout({
    currency: pago.moneda,
    amountInCents: pago.montoCentavos,
    reference: pago.referencia,
    publicKey: WOMPI_PUBLIC_KEY,
    signature: { integrity: pago.firma },
    customerData: { email: datos.email, fullName: datos.nombre },
  });

  checkout.open((resultado) => onTransaccion(resultado?.transaction ?? null));
}

function Campo({ etiqueta, error, children, ancho }) {
  return (
    <label className={`checkout-campo ${ancho === 'completo' ? 'checkout-campo-completo' : ''} ${error ? 'con-error' : ''}`}>
      {etiqueta}
      {children}
      {error && <span className="error-campo">{error}</span>}
    </label>
  );
}

function SeccionCheckout({ numero, titulo, children }) {
  return (
    <section className="checkout-seccion">
      <h2 className="checkout-seccion-titulo">
        <span className="checkout-seccion-numero">{numero}</span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function PedidoConfirmado({ pedido }) {
  const aprobado = pedido.pago.estado === 'aprobado';
  const metodo = METODOS_ENVIO.find((m) => m.valor === pedido.metodoEnvio);
  const pasos = [
    { texto: aprobado ? 'Pago aprobado' : 'Pago en verificación', estado: aprobado ? 'hecho' : 'actual' },
    { texto: 'Preparando tu pedido', estado: aprobado ? 'actual' : 'pendiente' },
    { texto: 'Enviado', estado: 'pendiente' },
  ];

  return (
    <div className="checkout-page checkout-confirmacion">
      <div className={`confirmacion-icono ${aprobado ? '' : 'confirmacion-icono-pendiente'}`}><FontAwesomeIcon icon={aprobado ? faCheck : faHourglassHalf} /></div>
      <h1>{aprobado ? '¡Gracias por tu compra!' : 'Estamos confirmando tu pago'}</h1>
      <p className="confirmacion-subtitulo">
        {aprobado
          ? `Tu pago fue aprobado. Te escribiremos a ${pedido.cliente.email} cuando despachemos tu pedido.`
          : `Wompi todavía está procesando tu pago. Te avisaremos a ${pedido.cliente.email} en cuanto se confirme.`}
      </p>

      <ol className="confirmacion-pasos">
        {pasos.map((paso) => (
          <li key={paso.texto} className={`paso-${paso.estado}`}>
            <span className="confirmacion-paso-punto" />
            {paso.texto}
          </li>
        ))}
      </ol>

      <div className="resumen-confirmado">
        <div className="resumen-confirmado-cabecera">
          <span>Pedido <strong>{pedido.referencia}</strong></span>
          <span>Transacción {pedido.pago.transaccionId}</span>
        </div>
        {pedido.items.map((item) => (
          <div key={item.id} className="resumen-item">
            <span>{item.nombre} × {item.cantidad}</span>
            <span>{formatPrecioCOP(Number(item.precio) * item.cantidad)}</span>
          </div>
        ))}
        <div className="resumen-item">
          <span>Envío {metodo?.nombre.toLowerCase()}</span>
          <span>{pedido.costoEnvio === 0 ? 'Gratis' : formatPrecioCOP(pedido.costoEnvio)}</span>
        </div>
        <div className="resumen-item resumen-total">
          <span>Total pagado</span>
          <span>{formatPrecioCOP(pedido.total)}</span>
        </div>
        <p className="resumen-confirmado-envio">
          Se enviará a {pedido.cliente.direccion}, {pedido.cliente.ciudad}
        </p>
      </div>

      <Link to="/productos" className="btn-volver-tienda">Seguir comprando</Link>
    </div>
  );
}

function Checkout() {
  const {
    carrito,
    itemsDisponibles,
    hayCambiosEnCarrito,
    actualizarCantidad,
    quitarProductoDelCarrito,
    quitarNoDisponibles,
    totalPrecio,
    vaciarCarrito,
  } = useCart();
  const { usuarioActual } = useAuth();
  const { recargarProductos } = useProductos();
  const [metodoEnvio, setMetodoEnvio] = useState('estandar');
  const [datos, setDatos] = useState(() => {
    const guardados = leerDatosEnvio();
    return {
      nombre: usuarioActual?.nombre || '',
      email: usuarioActual?.email || '',
      telefono: guardados.telefono || '',
      direccion: guardados.direccion || '',
      ciudad: guardados.ciudad || '',
      notas: '',
    };
  });
  const [errores, setErrores] = useState({});
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [errorPago, setErrorPago] = useState('');

  useDocumentTitle(pedidoConfirmado ? 'Pedido confirmado' : 'Finalizar compra');

  const costoEnvio = METODOS_ENVIO.find((m) => m.valor === metodoEnvio).costo;
  const totalConEnvio = totalPrecio + costoEnvio;
  const hayNoDisponibles = carrito.some((item) => !item.disponible);

  const handleChange = (campo) => (e) => {
    setDatos((prev) => ({ ...prev, [campo]: e.target.value }));
    // El error de un campo desaparece apenas el cliente lo corrige.
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (procesando || verificando) return;
    setErrorPago('');

    const nuevosErrores = validarDatos(datos);
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) {
      // Esperar a que React pinte los errores para llevar el cursor al primero
      requestAnimationFrame(() => document.querySelector('.checkout-campo.con-error input')?.focus());
      return;
    }

    if (!window.WidgetCheckout) return setErrorPago('No se pudo cargar la pasarela de pago de Wompi. Recarga la página.');
    if (!WOMPI_PUBLIC_KEY) return setErrorPago('Falta configurar VITE_WOMPI_PUBLIC_KEY');

    // 1. El backend crea el pedido: toma los precios de su catálogo, revisa el
    //    stock, suma el envío y firma ese total. Solo le enviamos ids y cantidades.
    setProcesando(true);
    let respuesta;
    try {
      respuesta = await pedirApi('/api/pedidos', {
        metodo: 'POST',
        cuerpo: {
          items: itemsDisponibles.map(({ id, cantidad }) => ({ id, cantidad })),
          metodoEnvio,
          cliente: datos,
          usuario: usuarioActual
            ? { id: usuarioActual.id, nombre: usuarioActual.nombre, email: usuarioActual.email }
            : null,
        },
      });
    } catch (error) {
      setErrorPago(error.message);
      recargarProductos(); // si fue por stock, el carrito se ajusta solo
      return;
    } finally {
      setProcesando(false);
    }
    guardarDatosEnvio(datos);

    // 2. Cuando Wompi termina, el backend verifica la transacción con Wompi
    //    antes de dar el pedido por pagado.
    const { referencia } = respuesta.pago;
    abrirWidgetWompi(respuesta.pago, datos, async (transaccion) => {
      if (!transaccion?.id) {
        setErrorPago('El pago no se completó. Puedes intentarlo de nuevo.');
        return;
      }
      setVerificando(true);
      try {
        const pedido = await pedirApi(`/api/pedidos/${encodeURIComponent(referencia)}/confirmar`, {
          metodo: 'POST',
          cuerpo: { transaccionId: transaccion.id },
        });
        if (pedido.pago.estado === 'rechazado') {
          setErrorPago('Tu banco rechazó el pago. Revisa los datos de la tarjeta o prueba con otro medio de pago.');
          return;
        }
        setPedidoConfirmado(pedido);
        vaciarCarrito();
        recargarProductos(); // el stock cambió
      } catch (error) {
        setErrorPago(`No pudimos verificar tu pago (pedido ${referencia}): ${error.message}`);
      } finally {
        setVerificando(false);
      }
    });
  };

  if (pedidoConfirmado) return <PedidoConfirmado pedido={pedidoConfirmado} />;

  if (carrito.length === 0) {
    return (
      <div className="checkout-page checkout-vacio">
        <p className="checkout-vacio-icono"><FontAwesomeIcon icon={faCartShopping} /></p>
        <h2>Tu carrito está vacío</h2>
        <p>Agrega algunos productos antes de continuar con la compra.</p>
        <Link to="/productos" className="btn-volver-tienda">Ver productos</Link>
      </div>
    );
  }

  const ocupado = procesando || verificando;

  return (
    <div className="checkout-page">
      <Link to="/productos" className="checkout-volver"><FontAwesomeIcon icon={faArrowLeft} /> Seguir comprando</Link>
      <h1>Finalizar compra</h1>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit} noValidate>
          <SeccionCheckout numero={1} titulo="¿A dónde lo enviamos?">
            <div className="checkout-campos">
              <Campo etiqueta="Nombre completo" error={errores.nombre}>
                <input type="text" autoComplete="name" value={datos.nombre} onChange={handleChange('nombre')} />
              </Campo>
              <Campo etiqueta="Correo electrónico" error={errores.email}>
                <input type="email" autoComplete="email" value={datos.email} onChange={handleChange('email')} />
              </Campo>
              <Campo etiqueta="Teléfono" error={errores.telefono}>
                <input type="tel" autoComplete="tel" placeholder="Ej: 300 123 4567" value={datos.telefono} onChange={handleChange('telefono')} />
              </Campo>
              <Campo etiqueta="Ciudad" error={errores.ciudad}>
                <input type="text" autoComplete="address-level2" value={datos.ciudad} onChange={handleChange('ciudad')} />
              </Campo>
              <Campo etiqueta="Dirección" error={errores.direccion} ancho="completo">
                <input
                  type="text"
                  autoComplete="street-address"
                  placeholder="Ej: Calle 10 # 20-30, apto 501"
                  value={datos.direccion}
                  onChange={handleChange('direccion')}
                />
              </Campo>
              <Campo etiqueta="Notas para la entrega (opcional)" ancho="completo">
                <textarea rows="2" placeholder="Ej: dejar en portería" value={datos.notas} onChange={handleChange('notas')} />
              </Campo>
            </div>
          </SeccionCheckout>

          <SeccionCheckout numero={2} titulo="Método de envío">
            <div className="metodo-envio-opciones">
              {METODOS_ENVIO.map((metodo) => (
                <label key={metodo.valor} className={`opcion-envio ${metodoEnvio === metodo.valor ? 'seleccionada' : ''}`}>
                  <input
                    type="radio"
                    name="metodoEnvio"
                    checked={metodoEnvio === metodo.valor}
                    onChange={() => setMetodoEnvio(metodo.valor)}
                  />
                  <span className="opcion-envio-texto">
                    <strong>{metodo.nombre}</strong>
                    <small>{metodo.tiempo}</small>
                  </span>
                  <span className="opcion-envio-precio">{metodo.costo === 0 ? 'Gratis' : formatPrecioCOP(metodo.costo)}</span>
                </label>
              ))}
            </div>
          </SeccionCheckout>

          <SeccionCheckout numero={3} titulo="Pago">
            <p className="checkout-pago-texto">
              Al continuar se abrirá la ventana segura de <strong>Wompi</strong>, donde eliges cómo pagar (tarjeta u otros medios que tenga habilitados la tienda).
            </p>
            {MODO_PRUEBAS && (
              <div className="aviso-pruebas">
                <strong>Modo de pruebas:</strong> no se cobra dinero real. Usa la tarjeta <code>4242 4242 4242 4242</code>,
                cualquier fecha futura y CVC <code>123</code>.
              </div>
            )}

            {errorPago && (
              <div className="checkout-error" role="alert">
                {errorPago}
              </div>
            )}

            <button type="submit" className="btn-confirmar-pedido" disabled={ocupado || itemsDisponibles.length === 0}>
              {procesando
                ? 'Preparando tu pedido…'
                : verificando
                ? 'Verificando el pago…'
                : `Pagar ${formatPrecioCOP(totalConEnvio)}`}
            </button>
            <p className="checkout-seguro"><FontAwesomeIcon icon={faLock} /> Tus datos de pago los maneja Wompi; nunca pasan por nuestra tienda.</p>
          </SeccionCheckout>
        </form>

        <aside className="checkout-resumen">
          <h3>
            Tu pedido <span>({itemsDisponibles.length} producto{itemsDisponibles.length === 1 ? '' : 's'})</span>
          </h3>

          {hayCambiosEnCarrito && (
            <div className="resumen-aviso-cambios">
              Algunos productos cambiaron desde que los agregaste.
              {hayNoDisponibles && (
                <button type="button" onClick={quitarNoDisponibles}>Quitar los no disponibles</button>
              )}
            </div>
          )}

          <div className="resumen-productos">
            {carrito.map((item) => {
              const aviso = avisoItemCarrito(item);
              return (
                <div key={item.id} className={`resumen-producto ${item.disponible ? '' : 'no-disponible'}`}>
                  <img src={item.imagen} alt={item.nombre} onError={handleImgError} />
                  <div className="resumen-producto-info">
                    <p className="resumen-producto-nombre">{item.nombre}</p>
                    {item.disponible ? (
                      <SelectorCantidad
                        cantidad={item.cantidad}
                        max={item.stock}
                        onCambiar={(cantidad) => actualizarCantidad(item.id, cantidad)}
                        tamano="pequeno"
                        etiqueta={`Cantidad de ${item.nombre}`}
                      />
                    ) : null}
                    {aviso && <p className="resumen-producto-aviso">{aviso}</p>}
                  </div>
                  <div className="resumen-producto-lado">
                    <span className="resumen-producto-precio">
                      {item.disponible ? formatPrecioCOP(Number(item.precio) * item.cantidad) : '—'}
                    </span>
                    <button
                      type="button"
                      className="resumen-producto-quitar"
                      onClick={() => quitarProductoDelCarrito(item.id)}
                      disabled={ocupado}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="resumen-linea">
            <span>Subtotal</span>
            <span>{formatPrecioCOP(totalPrecio)}</span>
          </div>
          <div className="resumen-linea">
            <span>Envío</span>
            <span>{costoEnvio === 0 ? 'Gratis' : formatPrecioCOP(costoEnvio)}</span>
          </div>
          <div className="resumen-linea resumen-total">
            <span>Total</span>
            <span>{formatPrecioCOP(totalConEnvio)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Checkout;
