// src/components/CarritoModal.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { handleImgError } from '../utils/placeholder';
import { formatPrecioCOP } from '../utils/precio';
import { avisoItemCarrito } from '../utils/carrito';
import SelectorCantidad from './SelectorCantidad';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping, faTrashCan, faXmark } from '@fortawesome/free-solid-svg-icons';
import './CarritoModal.css';

function CarritoModal({ isOpen, onClose }) {
  const {
    carrito,
    itemsDisponibles,
    actualizarCantidad,
    quitarProductoDelCarrito,
    vaciarCarrito,
    totalItems,
    totalPrecio,
  } = useCart();
  const navigate = useNavigate();

  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null;

  const handleFinalizarCompra = () => {
    onClose();
    navigate('/checkout');
  };

  const handleVaciar = () => {
    if (window.confirm('¿Quitar todos los productos del carrito?')) vaciarCarrito();
  };

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Carrito de compras">
        <div className="cart-header">
          <h3>
            Tu carrito {totalItems > 0 && <span className="cart-header-contador">{totalItems}</span>}
          </h3>
          <button className="btn-close" onClick={onClose} aria-label="Cerrar carrito"><FontAwesomeIcon icon={faXmark} /></button>
        </div>

        <div className="cart-body">
          {carrito.length === 0 ? (
            <div className="empty-cart">
              <p className="empty-cart-icono"><FontAwesomeIcon icon={faCartShopping} /></p>
              <p>Tu carrito está vacío</p>
              <button type="button" className="btn-seguir-comprando" onClick={() => { onClose(); navigate('/productos'); }}>
                Ver productos
              </button>
            </div>
          ) : (
            carrito.map((item) => {
              const aviso = avisoItemCarrito(item);
              return (
                <div key={item.id} className={`cart-item ${item.disponible ? '' : 'cart-item-no-disponible'}`}>
                  <img src={item.imagen} alt={item.nombre} onError={handleImgError} />
                  <div className="cart-item-details">
                    <h4>{item.nombre}</h4>
                    <p className="cart-item-price">
                      {formatPrecioCOP(item.precio)}
                      {item.disponible && item.cantidad > 1 && (
                        <span className="cart-item-subtotal"> · {formatPrecioCOP(Number(item.precio) * item.cantidad)}</span>
                      )}
                    </p>
                    {item.disponible && (
                      <SelectorCantidad
                        cantidad={item.cantidad}
                        max={item.stock}
                        onCambiar={(cantidad) => actualizarCantidad(item.id, cantidad)}
                        tamano="pequeno"
                        etiqueta={`Cantidad de ${item.nombre}`}
                      />
                    )}
                    {aviso && <p className="cart-item-aviso">{aviso}</p>}
                  </div>
                  <button
                    type="button"
                    className="btn-quitar-item"
                    onClick={() => quitarProductoDelCarrito(item.id)}
                    aria-label={`Quitar ${item.nombre} del carrito`}
                    title="Quitar del carrito"
                  >
                    <FontAwesomeIcon icon={faTrashCan} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {carrito.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Subtotal</span>
              <strong>{formatPrecioCOP(totalPrecio)}</strong>
            </div>
            <p className="cart-footer-nota">El envío se calcula en el siguiente paso.</p>
            <button className="btn-checkout" onClick={handleFinalizarCompra} disabled={itemsDisponibles.length === 0}>
              Finalizar compra
            </button>
            <button className="btn-clear" onClick={handleVaciar}>Vaciar carrito</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CarritoModal;
