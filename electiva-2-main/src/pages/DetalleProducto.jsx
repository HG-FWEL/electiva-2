// src/pages/DetalleProducto.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAdminProducts } from '../context/AdminProductsContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { handleImgError } from '../utils/placeholder';
import { formatPrecioCOP } from '../utils/precio';
import Modelo3DViewer from '../components/Modelo3DViewer';
import './DetalleProducto.css';

function DetalleProducto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { agregarAlCarrito, abrirCarrito, estaEnFavoritos, alternarFavorito } = useCart();
  const { catalogoCompleto } = useAdminProducts();

  // Buscar el producto en la lista según el ID de la URL
  const producto = catalogoCompleto.find((item) => item.id === id);

  useDocumentTitle(producto ? producto.nombre : 'Producto no encontrado');

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

  const manejarCompraDirecta = () => {
    agregarAlCarrito(producto);
    abrirCarrito();
  };

  return (
    <div className="detalle-container">
      <button type="button" className="btn-regresar" onClick={() => navigate(-1)}>
        ← Volver
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
            <span className="categoria-tag">{producto.categoria.toUpperCase()}</span>
            <button
              type="button"
              className={`detalle-favorito ${favorito ? 'activo' : ''}`}
              onClick={() => alternarFavorito(producto)}
            >
              {favorito ? '❤️ En favoritos' : '🤍 Agregar a favoritos'}
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

          <div className="detalle-acciones">
            <button
              type="button"
              className="btn-agregar"
              onClick={() => agregarAlCarrito(producto)}
              disabled={sinStock}
            >
              Añadir al carrito 🛒
            </button>
            <button
              type="button"
              className="btn-comprar"
              onClick={manejarCompraDirecta}
              disabled={sinStock}
            >
              Comprar ahora ⚡
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetalleProducto;
