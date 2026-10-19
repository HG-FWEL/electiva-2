// src/pages/Buscar.jsx
import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useProductos } from '../context/ProductosContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import ProductCard from '../components/ProductCard';
import ProductoModal from '../components/ProductoModal';
import './Computadores.css';
import './Buscar.css';

function Buscar() {
  const [searchParams] = useSearchParams();
  const consulta = (searchParams.get('q') || '').trim();
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const { productos, cargando, error } = useProductos();

  useDocumentTitle(consulta ? `Resultados para "${consulta}"` : 'Buscar');

  const resultados = useMemo(() => {
    if (!consulta) return [];
    const texto = consulta.toLowerCase();
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(texto) ||
        (p.marca && p.marca.toLowerCase().includes(texto)) ||
        p.categoria.toLowerCase().includes(texto)
    );
  }, [consulta, productos]);

  return (
    <div className="pagina-resultados">
      <h1>Resultados de búsqueda</h1>
      <p className="pagina-resultados-subtitulo">
        {consulta && cargando
          ? 'Cargando productos…'
          : consulta && error
          ? `No pudimos cargar los productos. ${error}`
          : consulta
          ? `${resultados.length} resultado${resultados.length === 1 ? '' : 's'} para "${consulta}"`
          : 'Escribe algo en el buscador para empezar.'}
      </p>

      {consulta && !cargando && !error && resultados.length === 0 && (
        <div className="sin-resultados-pagina">
          <p>No encontramos productos que coincidan con "{consulta}".</p>
          <Link to="/productos" className="btn-volver-tienda-link">Ver todo el catálogo</Link>
        </div>
      )}

      {resultados.length > 0 && (
        <div className="grid-productos grid-resultados">
          {resultados.map((prod) => (
            <ProductCard key={prod.id} producto={prod} onSeleccionar={setProductoSeleccionado} />
          ))}
        </div>
      )}

      <ProductoModal producto={productoSeleccionado} onClose={() => setProductoSeleccionado(null)} />
    </div>
  );
}

export default Buscar;
