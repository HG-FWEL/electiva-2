// src/pages/Favoritos.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import ProductCard from '../components/ProductCard';
import ProductoModal from '../components/ProductoModal';
import './Computadores.css';
import './Buscar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';


function Favoritos() {
  const { favoritos } = useCart();
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  useDocumentTitle('Mis favoritos');

  return (
    <div className="pagina-resultados">
      <h1>Mis favoritos</h1>
      <p className="pagina-resultados-subtitulo">
        {favoritos.length === 0
          ? 'Todavía no has guardado productos favoritos.'
          : `${favoritos.length} producto${favoritos.length === 1 ? '' : 's'} guardado${favoritos.length === 1 ? '' : 's'}.`}
      </p>

      {favoritos.length === 0 ? (
        <div className="sin-resultados-pagina">
          <p>Toca el ícono <FontAwesomeIcon icon={faHeartRegular} /> en cualquier producto para guardarlo aquí.</p>
          <Link to="/productos" className="btn-volver-tienda-link">Ver productos</Link>
        </div>
      ) : (
        <div className="grid-productos grid-resultados">
          {favoritos.map((prod) => (
            <ProductCard key={prod.id} producto={prod} onSeleccionar={setProductoSeleccionado} />
          ))}
        </div>
      )}

      <ProductoModal producto={productoSeleccionado} onClose={() => setProductoSeleccionado(null)} />
    </div>
  );
}

export default Favoritos;
