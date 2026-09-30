// src/components/ProductoModal.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { handleImgError } from '../utils/placeholder';
import { formatPrecioCOP } from '../utils/precio';
import './ProductoModal.css';

function ProductoModal({ producto, onClose }) {
  const { agregarAlCarrito, abrirCarrito, estaEnFavoritos, alternarFavorito } = useCart();
  const [agregado, setAgregado] = useState(false);
  const [cantidad, setCantidad] = useState(1);

  useEscapeKey(onClose, Boolean(producto));

  // Reiniciar la cantidad seleccionada cada vez que se abre un producto distinto
  useEffect(() => {
    setCantidad(1);
    setAgregado(false);
  }, [producto]);

  if (!producto) return null;

  const descripcion = producto.especificaciones || producto.descripcion || '';
  const stockDisponible = typeof producto.stock === 'number' ? producto.stock : null;
  const sinStock = stockDisponible !== null && stockDisponible <= 0;
  const favorito = estaEnFavoritos(producto.id);

  const handleAgregarAlCarrito = () => {
    agregarAlCarrito(producto, cantidad);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1600);
  };

  const handleComprarAhora = () => {
    agregarAlCarrito(producto, cantidad);
    onClose();
    abrirCarrito();
  };

  return (
    <div className="producto-modal-overlay" onClick={onClose}>
      <div className="producto-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="producto-modal-close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>

        <div className="producto-modal-imagen">
          <img src={producto.imagen} alt={producto.nombre} onError={handleImgError} />
        </div>

        <div className="producto-modal-info">
          <div className="producto-modal-top">
            {producto.marca && <span className="producto-modal-marca">{producto.marca}</span>}
            <button
              type="button"
              className={`producto-modal-favorito ${favorito ? 'activo' : ''}`}
              onClick={() => alternarFavorito(producto)}
              aria-label={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              {favorito ? '❤️ En favoritos' : '🤍 Agregar a favoritos'}
            </button>
          </div>

          <h2>{producto.nombre}</h2>
          <p className="producto-modal-precio">{formatPrecioCOP(producto.precio)}</p>

          {stockDisponible !== null && (
            <p className={`producto-modal-stock ${sinStock ? 'agotado' : stockDisponible <= 3 ? 'bajo' : ''}`}>
              {sinStock
                ? 'Sin stock disponible'
                : stockDisponible <= 3
                  ? `¡Solo quedan ${stockDisponible} unidades!`
                  : `${stockDisponible} unidades disponibles`}
            </p>
          )}

          {descripcion && (
            <div className="producto-modal-descripcion">
              <h4>Descripción</h4>
              <p>{descripcion}</p>
            </div>
          )}

          {!sinStock && (
            <div className="producto-modal-cantidad">
              <span>Cantidad:</span>
              <div className="cantidad-controles">
                <button type="button" onClick={() => setCantidad((c) => Math.max(1, c - 1))}>-</button>
                <span>{cantidad}</span>
                <button
                  type="button"
                  onClick={() => setCantidad((c) => (stockDisponible ? Math.min(stockDisponible, c + 1) : c + 1))}
                >
                  +
                </button>
              </div>
            </div>
          )}

          <div className="producto-modal-acciones">
            <button type="button" className="btn-agregar" onClick={handleAgregarAlCarrito} disabled={sinStock}>
              {sinStock ? 'Sin stock' : agregado ? 'Agregado ✓' : 'Agregar al carrito 🛒'}
            </button>
            <button type="button" className="btn-comprar-ahora" onClick={handleComprarAhora} disabled={sinStock}>
              Comprar ahora ⚡
            </button>
          </div>

          <Link to={`/producto/${producto.id}`} className="producto-modal-ficha" onClick={onClose}>
            Ver ficha completa del producto →
          </Link>

          <p className="producto-modal-hint">
            Puedes cerrar esta ventana y seguir agregando otros dispositivos antes de finalizar tu compra.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ProductoModal;
