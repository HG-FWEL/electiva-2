// src/pages/DetalleProducto.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useProductos } from '../context/ProductosContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { handleImgError } from '../utils/placeholder';
import { formatPrecioCOP } from '../utils/precio';
import Modelo3DViewer from '../components/Modelo3DViewer';
import SelectorCantidad from '../components/SelectorCantidad';
import { categorias } from '../data/Productos';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as faHeartLleno, faCartPlus, faBolt, faArrowLeft, faCheck } from '@fortawesome/free-solid-svg-icons';
import { faHeart } from '@fortawesome/free-regular-svg-icons';
import './DetalleProducto.css';

function DetalleProducto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { carrito, agregarAlCarrito, estaEnFavoritos, alternarFavorito } = useCart();
  const { productos, cargando, error } = useProductos();
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);

  // Buscar el producto en la lista según el ID de la URL
  const producto = productos.find((item) => item.id === id);

  useDocumentTitle(producto ? producto.nombre : cargando ? 'Cargando…' : 'Producto no encontrado');

  if (cargando) {
    return (
      <div className="detalle-error-container">
        <p>Cargando producto…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detalle-error-container">
        <h2>No pudimos cargar el producto</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="detalle-error-container">
        <h2>Producto no encontrado</h2>
        <p>El artículo que buscas no existe o fue retirado.</p>
        <button type="button" onClick={() => navigate('/productos')} className="btn-volver">
          Volver al catálogo
        </button>
      </div>
    );
  }

  const stockDisponible = typeof producto.stock === 'number' ? producto.stock : null;
  const sinStock = stockDisponible !== null && stockDisponible <= 0;
  const favorito = estaEnFavoritos(producto.id);

  const enCarrito = carrito.find((item) => item.id === producto.id)?.cantidad ?? 0;
  // Lo que todavía se puede agregar sin pasar del stock
  const maxAgregable = stockDisponible === null ? undefined : Math.max(1, stockDisponible - enCarrito);
  const sinMasUnidades = stockDisponible !== null && enCarrito >= stockDisponible;
  const cantidadElegida = Math.min(cantidad, maxAgregable ?? cantidad);

  const manejarAgregar = () => {
    agregarAlCarrito(producto, cantidadElegida);
    setCantidad(1);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1600);
  };

  const manejarCompraDirecta = () => {
    agregarAlCarrito(producto, cantidadElegida);
    navigate('/checkout');
  };

  return (
    <div className="detalle-container">
      <button type="button" className="btn-regresar" onClick={() => navigate(-1)}>
        <FontAwesomeIcon icon={faArrowLeft} /> Volver
      </button>

      <div className="detalle-card">
        <div className="detalle-imagen">
          {producto.modelo3d ? (
            <Modelo3DViewer ruta={producto.modelo3d} alt={producto.nombre} />
          ) : (
            <img src={producto.imagen} alt={producto.nombre} onError={handleImgError} />
          )}
        </div>

        <div className="detalle-info">
          <div className="detalle-top">
            <span className="categoria-tag">
              {categorias.find((c) => c.slug === producto.categoria)?.nombre ?? producto.categoria}
            </span>
            <button
              type="button"
              className={`detalle-favorito ${favorito ? 'activo' : ''}`}
              onClick={() => alternarFavorito(producto)}
              aria-pressed={favorito}
            >
              <FontAwesomeIcon icon={favorito ? faHeartLleno : faHeart} />
              {favorito ? 'En favoritos' : 'Agregar a favoritos'}
            </button>
          </div>

          <h1>{producto.nombre}</h1>
          <p className="detalle-precio">{formatPrecioCOP(producto.precio)}</p>

          {stockDisponible !== null && (
            <p className={`detalle-stock ${sinStock ? 'agotado' : stockDisponible <= 3 ? 'bajo' : ''}`}>
              {sinStock
                ? 'Sin stock disponible'
                : stockDisponible <= 3
                  ? `¡Solo quedan ${stockDisponible} unidades!`
                  : `${stockDisponible} unidades disponibles`}
            </p>
          )}

          <div className="detalle-descripcion">
            <h3>Descripción del producto</h3>
            <p>{producto.descripcion}</p>
          </div>

          {!sinStock && !sinMasUnidades && (
            <div className="detalle-cantidad">
              <span>Cantidad</span>
              <SelectorCantidad
                cantidad={cantidadElegida}
                max={maxAgregable}
                onCambiar={setCantidad}
              />
            </div>
          )}
          {enCarrito > 0 && (
            <p className="detalle-en-carrito">
              Ya tienes {enCarrito} en tu carrito{sinMasUnidades ? ' (es todo el stock disponible)' : ''}.
            </p>
          )}

          <div className="detalle-acciones">
            <button
              type="button"
              className="detalle-btn-agregar"
              onClick={manejarAgregar}
              disabled={sinStock || sinMasUnidades}
            >
              {sinStock ? (
                'Sin stock'
              ) : agregado ? (
                <><FontAwesomeIcon icon={faCheck} /> Agregado</>
              ) : (
                <><FontAwesomeIcon icon={faCartPlus} /> Añadir al carrito</>
              )}
            </button>
            <button
              type="button"
              className="detalle-btn-comprar"
              onClick={sinMasUnidades ? () => navigate('/checkout') : manejarCompraDirecta}
              disabled={sinStock}
            >
              <FontAwesomeIcon icon={faBolt} /> {sinMasUnidades ? 'Ir a pagar' : 'Comprar ahora'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetalleProducto;
