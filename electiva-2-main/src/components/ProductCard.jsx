// src/components/ProductCard.jsx
import React from 'react';
import { useCart } from '../context/CartContext';
import { handleImgError } from '../utils/placeholder';
import { formatPrecioCOP } from '../utils/precio';
import './ProductCard.css';

function ProductCard({ producto, onSeleccionar }) {
  const { estaEnFavoritos, alternarFavorito } = useCart();
  const favorito = estaEnFavoritos(producto.id);
  const sinStock = typeof producto.stock === 'number' && producto.stock <= 0;
  const pocoStock = typeof producto.stock === 'number' && producto.stock > 0 && producto.stock <= 3;

  return (
    <div
      className={`card-producto ${sinStock ? 'sin-stock' : ''}`}
      onClick={() => onSeleccionar(producto)}
      style={{ cursor: 'pointer' }}
    >
      <button
        type="button"
        className={`btn-favorito ${favorito ? 'activo' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          alternarFavorito(producto);
        }}
        aria-label={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        title={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      >
        {favorito ? '❤️' : '🤍'}
      </button>

      <div className="card-image">
        <img src={producto.imagen} alt={producto.nombre} onError={handleImgError} />
        {sinStock && <span className="badge-sin-stock">Agotado</span>}
        {!sinStock && pocoStock && <span className="badge-poco-stock">¡Últimas {producto.stock}!</span>}
      </div>

      <div className="card-info">
        <h4>{producto.nombre}</h4>
        <p className="specs">{producto.especificaciones}</p>
        <div className="card-footer">
          <span className="precio">{formatPrecioCOP(producto.precio)}</span>
          <button
            type="button"
            className="btn-comprar"
            disabled={sinStock}
            onClick={(e) => {
              e.stopPropagation();
              onSeleccionar(producto);
            }}
          >
            {sinStock ? 'Agotado' : 'Comprar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
