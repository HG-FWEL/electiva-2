// src/pages/Checkout.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { handleImgError } from '../utils/placeholder';
import { formatPrecioCOP } from '../utils/precio';
import './Checkout.css';

const ENVIO_ESTANDAR = 0;
const ENVIO_EXPRESS = 15;

function Checkout() {
  const { carrito, totalPrecio, vaciarCarrito } = useCart();
  const [metodoEnvio, setMetodoEnvio] = useState('estandar');
  const [datos, setDatos] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    notas: '',
  });
  const [errores, setErrores] = useState({});
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);

  useDocumentTitle(pedidoConfirmado ? 'Pedido confirmado' : 'Finalizar compra');

  const costoEnvio = metodoEnvio === 'express' ? ENVIO_EXPRESS : ENVIO_ESTANDAR;
  const totalConEnvio = totalPrecio + costoEnvio;

  const handleChange = (campo) => (e) => {
    setDatos((prev) => ({ ...prev, [campo]: e.target.value }));
  };

  const validar = () => {
    const nuevosErrores = {};
    if (!datos.nombre.trim()) nuevosErrores.nombre = 'Ingresa tu nombre completo';
    if (!/^\S+@\S+\.\S+$/.test(datos.email)) nuevosErrores.email = 'Ingresa un correo válido';
    if (!datos.telefono.trim()) nuevosErrores.telefono = 'Ingresa un teléfono de contacto';
    if (!datos.direccion.trim()) nuevosErrores.direccion = 'Ingresa tu dirección de envío';
    if (!datos.ciudad.trim()) nuevosErrores.ciudad = 'Ingresa tu ciudad';
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validar()) return;

    const numeroPedido = `MM-${Date.now().toString().slice(-6)}`;
    setPedidoConfirmado({
      numero: numeroPedido,
      items: carrito,
      total: totalConEnvio,
      datos,
      metodoEnvio,
    });
    vaciarCarrito();
  };

  // --- Pantalla: carrito vacío (y sin pedido recién confirmado) ---
  if (carrito.length === 0 && !pedidoConfirmado) {
    return (
      <div className="checkout-page checkout-vacio">
        <h2>Tu carrito está vacío</h2>
        <p>Agrega algunos productos antes de continuar con la compra.</p>
        <Link to="/productos" className="btn-volver-tienda">Ver productos</Link>
      </div>
    );
  }

  // --- Pantalla: pedido confirmado ---
  if (pedidoConfirmado) {
    return (
      <div className="checkout-page checkout-confirmacion">
        <div className="confirmacion-icono">✅</div>
        <h2>¡Pedido registrado con éxito!</h2>
        <p className="numero-pedido">Número de pedido: <strong>{pedidoConfirmado.numero}</strong></p>

        <div className="aviso-pago">
          Por ahora no procesamos el pago en línea: estamos integrando próximamente una pasarela de pago segura.
          Tu pedido quedó registrado como <strong>pago pendiente</strong> y nuestro equipo se pondrá en contacto
          por {pedidoConfirmado.datos.email} o al {pedidoConfirmado.datos.telefono} para coordinar el pago y la entrega.
        </div>

        <div className="resumen-confirmado">
          <h3>Resumen del pedido</h3>
          {pedidoConfirmado.items.map((item) => (
            <div key={item.id} className="resumen-item">
              <span>{item.nombre} × {item.cantidad}</span>
              <span>{formatPrecioCOP(Number(item.precio) * item.cantidad)}</span>
            </div>
          ))}
          <div className="resumen-item resumen-total">
            <span>Total</span>
            <span>{formatPrecioCOP(pedidoConfirmado.total)}</span>
          </div>
        </div>

        <Link to="/productos" className="btn-volver-tienda">Seguir comprando</Link>
      </div>
    );
  }

  // --- Pantalla: formulario de checkout ---
  return (
    <div className="checkout-page">
      <h1>Finalizar compra</h1>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit} noValidate>
          <h3>Datos de envío</h3>

          <label>
            Nombre completo
            <input type="text" value={datos.nombre} onChange={handleChange('nombre')} />
            {errores.nombre && <span className="error-campo">{errores.nombre}</span>}
          </label>

          <label>
            Correo electrónico
            <input type="email" value={datos.email} onChange={handleChange('email')} />
            {errores.email && <span className="error-campo">{errores.email}</span>}
          </label>

          <label>
            Teléfono
            <input type="tel" value={datos.telefono} onChange={handleChange('telefono')} />
            {errores.telefono && <span className="error-campo">{errores.telefono}</span>}
          </label>

          <label>
            Dirección
            <input type="text" value={datos.direccion} onChange={handleChange('direccion')} />
            {errores.direccion && <span className="error-campo">{errores.direccion}</span>}
          </label>

          <label>
            Ciudad
            <input type="text" value={datos.ciudad} onChange={handleChange('ciudad')} />
            {errores.ciudad && <span className="error-campo">{errores.ciudad}</span>}
          </label>

          <label>
            Notas de entrega (opcional)
            <textarea rows="3" value={datos.notas} onChange={handleChange('notas')} />
          </label>

          <h3>Método de envío</h3>
          <div className="metodo-envio-opciones">
            <label className={`opcion-envio ${metodoEnvio === 'estandar' ? 'seleccionada' : ''}`}>
              <input
                type="radio"
                name="metodoEnvio"
                checked={metodoEnvio === 'estandar'}
                onChange={() => setMetodoEnvio('estandar')}
              />
              <span>Estándar (3-5 días) · Gratis</span>
            </label>
            <label className={`opcion-envio ${metodoEnvio === 'express' ? 'seleccionada' : ''}`}>
              <input
                type="radio"
                name="metodoEnvio"
                checked={metodoEnvio === 'express'}
                onChange={() => setMetodoEnvio('express')}
              />
              <span>Express (24-48h) · {formatPrecioCOP(ENVIO_EXPRESS)}</span>
            </label>
          </div>

          <div className="aviso-pago aviso-pago-form">
            La pasarela de pago está en camino. Al confirmar, tu pedido queda registrado y coordinaremos el pago contigo directamente.
          </div>

          <button type="submit" className="btn-confirmar-pedido">Confirmar pedido</button>
        </form>

        <aside className="checkout-resumen">
          <h3>Resumen de tu pedido</h3>
          {carrito.map((item) => (
            <div key={item.id} className="resumen-producto">
              <img src={item.imagen} alt={item.nombre} onError={handleImgError} />
              <div>
                <p className="resumen-producto-nombre">{item.nombre}</p>
                <p className="resumen-producto-cantidad">Cantidad: {item.cantidad}</p>
              </div>
              <span className="resumen-producto-precio">
                {formatPrecioCOP(Number(item.precio) * item.cantidad)}
              </span>
            </div>
          ))}

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
