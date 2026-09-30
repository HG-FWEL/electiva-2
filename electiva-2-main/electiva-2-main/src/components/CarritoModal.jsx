// src/components/CarritoModal.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { handleImgError } from '../utils/placeholder';
import { formatPrecioCOP } from '../utils/precio';
import './CarritoModal.css';

function CarritoModal({ isOpen, onClose }) {
  const {
    carrito,
    agregarAlCarrito,
    eliminarDelCarrito,
    quitarProductoDelCarrito,
    vaciarCarrito,
    totalPrecio,
  } = useCart();
  const navigate = useNavigate();

  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null;

  const handleFinalizarCompra = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h3>Tu Carrito de Compras</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="cart-body">
          {carrito.length === 0 ? (
            <p className="empty-cart">El carrito está vacío</p>
          ) : (
            carrito.map((item) => {
              const alcanzoStock = typeof item.stock === 'number' && item.cantidad >= item.stock;
              return (
                <div key={item.id} className="cart-item">
                  <img src={item.imagen} alt={item.nombre} onError={handleImgError} />
                  <div className="cart-item-details">
                    <h4>{item.nombre}</h4>
                    <p className="cart-item-price">{formatPrecioCOP(item.precio)}</p>
                    <div className="quantity-controls">
                      <button onClick={() => eliminarDelCarrito(item.id)}>-</button>
                      <span>{item.cantidad}</span>
                      <button onClick={() => agregarAlCarrito(item)} disabled={alcanzoStock} title={alcanzoStock ? 'No hay más stock disponible' : ''}>
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-quitar-item"
                    onClick={() => quitarProductoDelCarrito(item.id)}
                    aria-label={`Quitar ${item.nombre} del carrito`}
                  >
                    🗑️
                  </button>
                </div>
              );
            })
          )}
        </div>

        {carrito.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Total:</span>
              <strong>{formatPrecioCOP(totalPrecio)}</strong>
            </div>
            <button className="btn-checkout" onClick={handleFinalizarCompra}>Finalizar Compra</button>
            <button className="btn-clear" onClick={vaciarCarrito}>Vaciar Carrito</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CarritoModal;
