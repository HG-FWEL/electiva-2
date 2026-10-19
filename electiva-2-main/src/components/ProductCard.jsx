// src/components/ProductCard.jsx
// Tarjeta de producto: un clic en la tarjeta abre la ventana rápida (onSeleccionar);
// el botón "Agregar" lo pone directo en el carrito sin salir de la página.
import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { handleImgError } from '../utils/placeholder';
import { formatPrecioCOP } from '../utils/precio';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as faHeartLleno, faCartPlus, faCheck } from '@fortawesome/free-solid-svg-icons';
import { faHeart } from '@fortawesome/free-regular-svg-icons';
import './ProductCard.css';

function ProductCard({ producto, onSeleccionar }) {
  const { carrito, estaEnFavoritos, alternarFavorito, agregarAlCarrito } = useCart();
  const [agregado, setAgregado] = useState(false);
  const favorito = estaEnFavoritos(producto.id);
  const sinStock = typeof producto.stock === 'number' && producto.stock <= 0;
  const pocoStock = typeof producto.stock === 'number' && producto.stock > 0 && producto.stock <= 3;
  const enCarrito = carrito.find((item) => item.id === producto.id)?.cantidad ?? 0;
  const topeAlcanzado = typeof producto.stock === 'number' && enCarrito >= producto.stock;

  const handleAgregar = (e) => {
    e.stopPropagation();
    agregarAlCarrito(producto, 1);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1500);
  };

  return (
    <div
      className={`card-producto ${sinStock ? 'sin-stock' : ''}`}
      onClick={() => onSeleccionar(producto)}
      onKeyDown={(e) => e.key === 'Enter' && e.target === e.currentTarget && onSeleccionar(producto)}
      role="button"
      tabIndex={0}
      aria-label={`Ver ${producto.nombre}`}
    >
      <button
        type="button"
        className={`btn-favorito ${favorito ? 'activo' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          alternarFavorito(producto);
        }}
        aria-label={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        aria-pressed={favorito}
        title={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      >
        <FontAwesomeIcon icon={favorito ? faHeartLleno : faHeart} />
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
            className={`card-btn-agregar ${agregado ? 'agregado' : ''}`}
            disabled={sinStock || topeAlcanzado}
            onClick={handleAgregar}
            aria-label={`Agregar ${producto.nombre} al carrito`}
            title={topeAlcanzado && !sinStock ? 'Ya tienes todo el stock en tu carrito' : undefined}
          >
            <FontAwesomeIcon icon={agregado ? faCheck : faCartPlus} />
            {sinStock ? 'Agotado' : agregado ? 'Listo' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
