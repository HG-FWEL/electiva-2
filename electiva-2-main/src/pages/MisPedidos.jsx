// src/pages/MisPedidos.jsx
// Pedidos del cliente que inició sesión y en qué estado va cada uno.
import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxOpen,
  faCheck,
  faCircleXmark,
  faHourglassHalf,
  faRotate,
  faTruckFast,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { pedirApi } from '../utils/api';
import { formatPrecioCOP } from '../utils/precio';
import { handleImgError } from '../utils/placeholder';
import './MisPedidos.css';

function formatFecha(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Traduce el estado del pago y del envío a lo que ve el cliente.
function estadoDelPedido(pedido) {
  if (pedido.pago.estado === 'rechazado') {
    return { clave: 'rechazado', texto: 'Pago rechazado', icono: faCircleXmark, paso: 0 };
  }
  if (pedido.pago.estado !== 'aprobado') {
    return { clave: 'pendiente', texto: 'Pago en verificación', icono: faHourglassHalf, paso: 0 };
  }
  if (pedido.envio.estado === 'enviado') {
    return { clave: 'enviado', texto: 'Enviado', icono: faTruckFast, paso: 3 };
  }
  return { clave: 'preparando', texto: 'Preparando tu pedido', icono: faBoxOpen, paso: 1 };
}

function LineaDeEstado({ paso, pagoAprobado }) {
  const pasos = [pagoAprobado ? 'Pago aprobado' : 'Verificando pago', 'Preparando', 'Enviado'];
  return (
    <ol className="mis-pedidos-pasos" aria-label="Avance del pedido">
      {pasos.map((texto, i) => {
        const estado = i < paso ? 'hecho' : i === paso ? 'actual' : 'pendiente';
        return (
          <li key={texto} className={`mis-pedidos-paso paso-${estado}`}>
            <span className="mis-pedidos-paso-punto">{estado === 'hecho' && <FontAwesomeIcon icon={faCheck} />}</span>
            {texto}
          </li>
        );
      })}
    </ol>
  );
}

function MensajeDeEstado({ pedido, estado }) {
  if (estado.clave === 'rechazado') {
    return <p className="mis-pedidos-mensaje mensaje-error">Tu banco rechazó el pago, así que este pedido no se procesará. Puedes volver a comprar los productos cuando quieras.</p>;
  }
  if (estado.clave === 'pendiente') {
    return <p className="mis-pedidos-mensaje mensaje-aviso">Wompi todavía está confirmando tu pago. Te avisaremos por correo en cuanto se apruebe.</p>;
  }
  if (estado.clave === 'enviado') {
    return <p className="mis-pedidos-mensaje mensaje-exito">Tu pedido va en camino a {pedido.direccion.direccion}, {pedido.direccion.ciudad}. Lo despachamos el {formatFecha(pedido.envio.fecha)}.</p>;
  }
  return <p className="mis-pedidos-mensaje">Estamos alistando tu pedido. Te escribiremos cuando lo despachemos a {pedido.direccion.ciudad}.</p>;
}

function TarjetaPedido({ pedido }) {
  const estado = estadoDelPedido(pedido);
  const unidades = pedido.items.reduce((total, item) => total + item.cantidad, 0);

  return (
    <article className={`mis-pedidos-tarjeta estado-${estado.clave}`}>
      <header className="mis-pedidos-cabecera">
        <div>
          <h2>Pedido del {formatFecha(pedido.fecha)}</h2>
          <span className="mis-pedidos-referencia">
            {pedido.referencia} · {unidades} {unidades === 1 ? 'producto' : 'productos'}
          </span>
        </div>
        <span className={`mis-pedidos-insignia insignia-${estado.clave}`}>
          <FontAwesomeIcon icon={estado.icono} /> {estado.texto}
        </span>
      </header>

      {estado.clave !== 'rechazado' && <LineaDeEstado paso={estado.paso} pagoAprobado={pedido.pago.estado === 'aprobado'} />}
      <MensajeDeEstado pedido={pedido} estado={estado} />

      <ul className="mis-pedidos-items">
        {pedido.items.map((item) => (
          <li key={item.id}>
            <img src={item.imagen} alt={item.nombre} onError={handleImgError} />
            <span className="mis-pedidos-item-nombre">{item.nombre}</span>
            <span className="mis-pedidos-item-cantidad">× {item.cantidad}</span>
            <span className="mis-pedidos-item-precio">{formatPrecioCOP(item.precio * item.cantidad)}</span>
          </li>
        ))}
      </ul>

      <footer className="mis-pedidos-pie">
        <span>
          Envío {pedido.metodoEnvio === 'express' ? 'express' : 'estándar'}:{' '}
          {pedido.costoEnvio === 0 ? 'Gratis' : formatPrecioCOP(pedido.costoEnvio)}
        </span>
        <span className="mis-pedidos-total">
          Total <strong>{formatPrecioCOP(pedido.total)}</strong>
        </span>
      </footer>
    </article>
  );
}

function MisPedidos() {
  const { usuarioActual, listo } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useDocumentTitle('Mis pedidos');

  // Cambiar este número vuelve a pedir la lista (botón "Actualizar").
  const [recargas, setRecargas] = useState(0);

  useEffect(() => {
    if (!usuarioActual) return undefined;
    let vigente = true; // ignora la respuesta si el usuario salió de la página
    pedirApi('/api/pedidos/mios')
      .then((datos) => {
        if (!vigente) return;
        setPedidos(datos);
        setError('');
      })
      .catch((e) => vigente && setError(e.message))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [usuarioActual, recargas]);

  const cargar = () => {
    setCargando(true);
    setRecargas((n) => n + 1);
  };

  if (!listo) return null;
  if (!usuarioActual) return <Navigate to="/login" state={{ from: '/mis-pedidos' }} replace />;

  return (
    <div className="mis-pedidos-page">
      <div className="mis-pedidos-titulo">
        <div>
          <h1>Mis pedidos</h1>
          <p>Aquí ves todas tus compras y en qué va cada una.</p>
        </div>
        <button type="button" className="mis-pedidos-actualizar" onClick={cargar} disabled={cargando}>
          <FontAwesomeIcon icon={faRotate} spin={cargando} /> Actualizar
        </button>
      </div>

      {error && (
        <div className="mis-pedidos-vacio">
          <p>{error}</p>
          <button type="button" className="mis-pedidos-boton" onClick={cargar}>Intentar de nuevo</button>
        </div>
      )}

      {!error && cargando && pedidos.length === 0 && <p className="mis-pedidos-cargando">Cargando tus pedidos…</p>}

      {!error && !cargando && pedidos.length === 0 && (
        <div className="mis-pedidos-vacio">
          <p className="mis-pedidos-vacio-icono"><FontAwesomeIcon icon={faBoxOpen} /></p>
          <h2>Todavía no tienes pedidos</h2>
          <p>Cuando hagas una compra aparecerá aquí con su estado.</p>
          <Link to="/productos" className="mis-pedidos-boton">Ver productos</Link>
        </div>
      )}

      <div className="mis-pedidos-lista">
        {pedidos.map((pedido) => (
          <TarjetaPedido key={pedido.referencia} pedido={pedido} />
        ))}
      </div>
    </div>
  );
}

export default MisPedidos;
