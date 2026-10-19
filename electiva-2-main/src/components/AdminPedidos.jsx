// src/components/AdminPedidos.jsx
// Pedidos pagados, leídos del backend. Recibe los datos y acciones de usePedidos()
// desde la página de Admin (que también los usa para el contador de la pestaña).
import React, { useMemo, useState } from 'react';
import { ESTADOS_ENVIO } from '../hooks/usePedidos';
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
  faRotate,
} from '@fortawesome/free-solid-svg-icons';

const FILTROS = [
  { valor: 'todos', texto: 'Todos' },
  { valor: 'revision', texto: ESTADOS_ENVIO.revision },
  { valor: 'enviado', texto: ESTADOS_ENVIO.enviado },
];

function formatFecha(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

function AdminPedidos({ pedidos, cargando, error, recargarPedidos, cambiarEstadoEnvio, verificarPago }) {
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [procesando, setProcesando] = useState(null);

  const estadisticas = useMemo(() => {
    const enRevision = pedidos.filter((p) => p.envio.estado === 'revision').length;
    const enviados = pedidos.filter((p) => p.envio.estado === 'enviado').length;
    // Solo cuenta como vendido lo que Wompi ya aprobó.
    const ventas = pedidos
      .filter((p) => p.pago.estado === 'aprobado')
      .reduce((acc, p) => acc + Number(p.total || 0), 0);
    return { total: pedidos.length, enRevision, enviados, ventas };
  }, [pedidos]);

  const pedidosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return pedidos.filter((p) => {
      if (filtro !== 'todos' && p.envio.estado !== filtro) return false;
      if (!texto) return true;
      return (
        p.referencia.toLowerCase().includes(texto) ||
        p.cliente.nombre.toLowerCase().includes(texto) ||
        p.cliente.email.toLowerCase().includes(texto) ||
        p.items.some((item) => item.nombre.toLowerCase().includes(texto))
      );
    });
  }, [pedidos, filtro, busqueda]);

  // Ejecuta una acción sobre un pedido mostrando el error si el backend la rechaza.
  const ejecutar = async (pedido, accion) => {
    setProcesando(pedido.referencia);
    try {
      await accion();
    } catch (errorAccion) {
      window.alert(errorAccion.message);
    } finally {
      setProcesando(null);
    }
  };

  const handleCambiarEstado = (pedido, estado) => {
    if (estado === 'enviado') {
      const confirmado = window.confirm(`¿Marcar el pedido ${pedido.referencia} de ${pedido.cliente.nombre} como enviado?`);
      if (!confirmado) return;
    }
    ejecutar(pedido, () => cambiarEstadoEnvio(pedido.referencia, estado));
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
          <button type="button" className="admin-filtro" onClick={recargarPedidos} title="Actualizar lista">
            <FontAwesomeIcon icon={faRotate} />
          </button>
        </div>
      </div>

      <div className="admin-pedidos">
        {pedidosFiltrados.map((pedido) => (
          <article key={pedido.referencia} className={`admin-pedido estado-${pedido.envio.estado}`}>
            <header className="admin-pedido-header">
              <div>
                <p className="admin-pedido-cliente">
                  <strong>{pedido.cliente.nombre}</strong> compró {pedido.items.length} producto
                  {pedido.items.length === 1 ? '' : 's'}
                </p>
                <p className="admin-pedido-meta">
                  Pedido <strong>{pedido.referencia}</strong> · {formatFecha(pedido.fecha)}
                  {pedido.usuario ? ' · Cliente registrado' : ' · Compra como invitado'}
                  {' · '}Transacción Wompi {pedido.pago.transaccionId}
                </p>
              </div>
              {pedido.pago.estado === 'pendiente' ? (
                <span className="admin-badge-estado estado-revision">
                  <FontAwesomeIcon icon={faHourglassHalf} />
                  Pago pendiente
                </span>
              ) : (
                <span className={`admin-badge-estado estado-${pedido.envio.estado}`}>
                  <FontAwesomeIcon icon={pedido.envio.estado === 'enviado' ? faTruckFast : faHourglassHalf} />
                  {ESTADOS_ENVIO[pedido.envio.estado]}
                </span>
              )}
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
                  <FontAwesomeIcon icon={faLocationDot} /> {pedido.cliente.direccion}, {pedido.cliente.ciudad}
                </p>
                <p>
                  <FontAwesomeIcon icon={faPhone} /> {pedido.cliente.telefono}
                </p>
                <p>
                  <FontAwesomeIcon icon={faEnvelope} /> {pedido.cliente.email}
                </p>
                <p className="admin-pedido-metodo">
                  Envío {pedido.metodoEnvio === 'express' ? 'Express (24-48h)' : 'Estándar (3-5 días)'}
                </p>
                {pedido.cliente.notas && <p className="admin-pedido-notas">“{pedido.cliente.notas}”</p>}
              </div>
            </div>

            <footer className="admin-pedido-footer">
              <span className="admin-pedido-total">
                Total: <strong>{formatPrecioCOP(pedido.total)}</strong>
              </span>
              {pedido.pago.estado === 'pendiente' ? (
                <button
                  type="button"
                  className="btn-admin-revertir"
                  disabled={procesando === pedido.referencia}
                  onClick={() => ejecutar(pedido, () => verificarPago(pedido))}
                  title="Preguntarle a Wompi si el pago ya se aprobó"
                >
                  <FontAwesomeIcon icon={faRotate} /> Verificar pago con Wompi
                </button>
              ) : pedido.envio.estado === 'revision' ? (
                <button
                  type="button"
                  className="btn-admin-enviar"
                  disabled={procesando === pedido.referencia}
                  onClick={() => handleCambiarEstado(pedido, 'enviado')}
                >
                  <FontAwesomeIcon icon={faTruckFast} /> Marcar como enviado
                </button>
              ) : (
                <div className="admin-pedido-enviado">
                  <span>Enviado el {formatFecha(pedido.envio.fecha)}</span>
                  <button
                    type="button"
                    className="btn-admin-revertir"
                    disabled={procesando === pedido.referencia}
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
            {cargando
              ? 'Cargando pedidos…'
              : error
              ? `No se pudieron cargar los pedidos: ${error}`
              : pedidos.length === 0
              ? 'Todavía no hay pedidos. Cuando un cliente pague una compra aparecerá aquí.'
              : 'No hay pedidos que coincidan con el filtro.'}
          </div>
        )}
      </div>
    </>
  );
}

export default AdminPedidos;
