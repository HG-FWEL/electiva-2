// src/components/AdminPedidos.jsx
import React, { useMemo, useState } from 'react';
import { useOrders, ESTADOS_PEDIDO } from '../context/OrdersContext';
import { handleImgError } from '../utils/placeholder';
import { formatPrecioCOP } from '../utils/precio';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faReceipt,
  faHourglassHalf,
  faTruckFast,
  faSackDollar,
  faMagnifyingGlass,
  faLocationDot,
  faPhone,
  faEnvelope,
  faRotateLeft,
} from '@fortawesome/free-solid-svg-icons';

const FILTROS = [
  { valor: 'todos', texto: 'Todos' },
  { valor: 'revision', texto: ESTADOS_PEDIDO.revision },
  { valor: 'enviado', texto: ESTADOS_PEDIDO.enviado },
];

function formatFecha(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

function AdminPedidos() {
  const { pedidos, cambiarEstadoPedido } = useOrders();
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  const estadisticas = useMemo(() => {
    const enRevision = pedidos.filter((p) => p.estado === 'revision').length;
    const enviados = pedidos.filter((p) => p.estado === 'enviado').length;
    const ventas = pedidos.reduce((acc, p) => acc + Number(p.total || 0), 0);
    return { total: pedidos.length, enRevision, enviados, ventas };
  }, [pedidos]);

  const pedidosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return pedidos.filter((p) => {
      if (filtro !== 'todos' && p.estado !== filtro) return false;
      if (!texto) return true;
      return (
        p.numero.toLowerCase().includes(texto) ||
        p.datos.nombre.toLowerCase().includes(texto) ||
        p.datos.email.toLowerCase().includes(texto) ||
        p.items.some((item) => item.nombre.toLowerCase().includes(texto))
      );
    });
  }, [pedidos, filtro, busqueda]);

  const handleCambiarEstado = (pedido, estado) => {
    if (estado === 'enviado') {
      const confirmado = window.confirm(`¿Marcar el pedido ${pedido.numero} de ${pedido.datos.nombre} como enviado?`);
      if (!confirmado) return;
    }
    cambiarEstadoPedido(pedido.numero, estado);
  };

  return (
    <>
      <div className="admin-stats">
        <div className="admin-stat-card">
          <span className="admin-stat-icono icono-azul">
            <FontAwesomeIcon icon={faReceipt} />
          </span>
          <div>
            <span className="admin-stat-valor">{estadisticas.total}</span>
            <span className="admin-stat-label">Pedidos totales</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-icono icono-naranja">
            <FontAwesomeIcon icon={faHourglassHalf} />
          </span>
          <div>
            <span className="admin-stat-valor">{estadisticas.enRevision}</span>
            <span className="admin-stat-label">En revisión</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-icono icono-verde">
            <FontAwesomeIcon icon={faTruckFast} />
          </span>
          <div>
            <span className="admin-stat-valor">{estadisticas.enviados}</span>
            <span className="admin-stat-label">Enviados</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-icono icono-morado">
            <FontAwesomeIcon icon={faSackDollar} />
          </span>
          <div>
            <span className="admin-stat-valor admin-stat-valor-dinero">{formatPrecioCOP(estadisticas.ventas)}</span>
            <span className="admin-stat-label">Total vendido</span>
          </div>
        </div>
      </div>

      <div className="admin-buscador">
        <div className="admin-buscador-input">
          <FontAwesomeIcon icon={faMagnifyingGlass} />
          <input
            type="text"
            placeholder="Buscar por cliente, correo, pedido o producto…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="admin-filtros">
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              type="button"
              className={`admin-filtro ${filtro === f.valor ? 'activo' : ''}`}
              onClick={() => setFiltro(f.valor)}
            >
              {f.texto}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-pedidos">
        {pedidosFiltrados.map((pedido) => (
          <article key={pedido.numero} className={`admin-pedido estado-${pedido.estado}`}>
            <header className="admin-pedido-header">
              <div>
                <p className="admin-pedido-cliente">
                  <strong>{pedido.datos.nombre}</strong> compró {pedido.items.length} producto
                  {pedido.items.length === 1 ? '' : 's'}
                </p>
                <p className="admin-pedido-meta">
                  Pedido <strong>{pedido.numero}</strong> · {formatFecha(pedido.fecha)}
                  {pedido.usuario ? ' · Cliente registrado' : ' · Compra como invitado'}
                </p>
              </div>
              <span className={`admin-badge-estado estado-${pedido.estado}`}>
                <FontAwesomeIcon icon={pedido.estado === 'enviado' ? faTruckFast : faHourglassHalf} />
                {ESTADOS_PEDIDO[pedido.estado]}
              </span>
            </header>

            <div className="admin-pedido-cuerpo">
              <ul className="admin-pedido-items">
                {pedido.items.map((item) => (
                  <li key={item.id}>
                    <img src={item.imagen} alt={item.nombre} onError={handleImgError} />
                    <span className="admin-pedido-item-nombre">{item.nombre}</span>
                    <span className="admin-pedido-item-cantidad">× {item.cantidad}</span>
                    <span className="admin-pedido-item-precio">
                      {formatPrecioCOP(Number(item.precio) * item.cantidad)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="admin-pedido-envio">
                <h4>Datos de despacho</h4>
                <p>
                  <FontAwesomeIcon icon={faLocationDot} /> {pedido.datos.direccion}, {pedido.datos.ciudad}
                </p>
                <p>
                  <FontAwesomeIcon icon={faPhone} /> {pedido.datos.telefono}
                </p>
                <p>
                  <FontAwesomeIcon icon={faEnvelope} /> {pedido.datos.email}
                </p>
                <p className="admin-pedido-metodo">
                  Envío {pedido.metodoEnvio === 'express' ? 'Express (24-48h)' : 'Estándar (3-5 días)'}
                </p>
                {pedido.datos.notas && <p className="admin-pedido-notas">“{pedido.datos.notas}”</p>}
              </div>
            </div>

            <footer className="admin-pedido-footer">
              <span className="admin-pedido-total">
                Total: <strong>{formatPrecioCOP(pedido.total)}</strong>
              </span>
              {pedido.estado === 'revision' ? (
                <button
                  type="button"
                  className="btn-admin-enviar"
                  onClick={() => handleCambiarEstado(pedido, 'enviado')}
                >
                  <FontAwesomeIcon icon={faTruckFast} /> Marcar como enviado
                </button>
              ) : (
                <div className="admin-pedido-enviado">
                  <span>Enviado el {formatFecha(pedido.fechaEnvio)}</span>
                  <button
                    type="button"
                    className="btn-admin-revertir"
                    onClick={() => handleCambiarEstado(pedido, 'revision')}
                    title="Volver a revisión"
                  >
                    <FontAwesomeIcon icon={faRotateLeft} /> Volver a revisión
                  </button>
                </div>
              )}
            </footer>
          </article>
        ))}

        {pedidosFiltrados.length === 0 && (
          <div className="admin-pedidos-vacio">
            {pedidos.length === 0
              ? 'Todavía no hay pedidos. Cuando un cliente finalice una compra aparecerá aquí.'
              : 'No hay pedidos que coincidan con el filtro.'}
          </div>
        )}
      </div>
    </>
  );
}

export default AdminPedidos;
