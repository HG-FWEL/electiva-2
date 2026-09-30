// src/components/CategoryLayout.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { categorias } from '../data/Productos';
import { useAdminProducts } from '../context/AdminProductsContext';
import ProductCard from './ProductCard';
import ProductoModal from './ProductoModal';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import '../pages/Computadores.css';
import './CategoryLayout.css';

const PRODUCTOS_POR_PAGINA = 6;

function CategoryLayout({
  categoriaSlug,
  titulo,
  badge,
  descripcion,
  heroImagen,
  ordenarPorTexto = 'Recomendados',
}) {
  const [filtroSeleccionado, setFiltroSeleccionado] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [visibleCount, setVisibleCount] = useState(PRODUCTOS_POR_PAGINA);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  useDocumentTitle(titulo);

  const { catalogoCompleto } = useAdminProducts();

  const productosCategoria = useMemo(
    () => catalogoCompleto.filter((p) => p.categoria === categoriaSlug),
    [catalogoCompleto, categoriaSlug]
  );

  // Detecta automáticamente si esta categoría se filtra por "marca" o por "linea"
  const campoFiltro = productosCategoria.some((p) => p.marca)
    ? 'marca'
    : productosCategoria.some((p) => p.linea)
      ? 'linea'
      : null;

  const valoresFiltro = campoFiltro
    ? ['Todas', ...new Set(productosCategoria.map((p) => p[campoFiltro]).filter(Boolean))]
    : [];

  const productosFiltrados = productosCategoria.filter((p) => {
    const coincideFiltro = !campoFiltro || filtroSeleccionado === 'Todas' || p[campoFiltro] === filtroSeleccionado;
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase());
    return coincideFiltro && coincideBusqueda;
  });

  const productosVisibles = productosFiltrados.slice(0, visibleCount);
  const hayMasProductos = visibleCount < productosFiltrados.length;

  // Si cambia el filtro o la búsqueda, volvemos a mostrar la primera tanda
  useEffect(() => {
    setVisibleCount(PRODUCTOS_POR_PAGINA);
  }, [filtroSeleccionado, busqueda]);

  return (
    <div className="computadores-page">
      {/* HERO */}
      <section className="hero-computadores">
        <div className="hero-text">
          {badge && <span className="badge-destacados">{badge}</span>}
          <h1>{titulo}</h1>
          <p>{descripcion}</p>
        </div>
        <div className="hero-image-container">
          <img src={heroImagen} alt={titulo} />
        </div>
      </section>

      {/* CONTENIDO PRINCIPAL */}
      <div className="computadores-content">
        <aside className="sidebar-categorias">
          <h3>CATEGORÍAS</h3>
          <ul>
            {categorias.map((cat) => (
              <li key={cat.slug}>
                <Link
                  to={cat.ruta}
                  className={`btn-categoria ${cat.slug === categoriaSlug ? 'active' : ''}`}
                >
                  {cat.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <main className="catalog-container">
          <div className="catalog-header catalog-header-columna">
            <div className="catalog-header-fila">
              {campoFiltro && (
                <div className="filtro-marcas">
                  <span className="filtro-label">Filtrar por {campoFiltro === 'marca' ? 'marca' : 'línea'}:</span>
                  {valoresFiltro.map((valor) => (
                    <button
                      key={valor}
                      type="button"
                      className={`btn-categoria btn-filtro ${filtroSeleccionado === valor ? 'active' : ''}`}
                      onClick={() => setFiltroSeleccionado(valor)}
                    >
                      {valor}
                    </button>
                  ))}
                </div>
              )}

              <div className="buscador-categoria">
                <input
                  type="text"
                  placeholder="Buscar en esta categoría…"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </div>

            <div className="catalog-header-info">
              <span>
                Mostrando {productosVisibles.length} de {productosFiltrados.length} producto
                {productosFiltrados.length === 1 ? '' : 's'}
              </span>
              <div className="sort-by">
                Ordenar por: <strong>{ordenarPorTexto}</strong>
              </div>
            </div>
          </div>

          {productosFiltrados.length === 0 ? (
            <p className="sin-resultados">No encontramos productos que coincidan con tu búsqueda.</p>
          ) : (
            <div className="grid-productos">
              {productosVisibles.map((prod) => (
                <ProductCard key={prod.id} producto={prod} onSeleccionar={setProductoSeleccionado} />
              ))}
            </div>
          )}

          {hayMasProductos && (
            <div className="cargar-mas-contenedor">
              <button
                type="button"
                className="btn-cargar-mas"
                onClick={() => setVisibleCount((v) => v + PRODUCTOS_POR_PAGINA)}
              >
                Cargar más productos
              </button>
            </div>
          )}
        </main>
      </div>

      <ProductoModal producto={productoSeleccionado} onClose={() => setProductoSeleccionado(null)} />
    </div>
  );
}

export default CategoryLayout;
