// src/components/CategoryLayout.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { categorias } from '../data/Productos';
import { useProductos } from '../context/ProductosContext';
import ProductCard from './ProductCard';
import ProductoModal from './ProductoModal';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import '../pages/Computadores.css';
import './CategoryLayout.css';

const PRODUCTOS_POR_PAGINA = 6;

// "destacados" respeta el orden del catálogo; las demás opciones lo reordenan.
const ORDENES = {
  'precio-asc': { texto: 'Precio: menor a mayor', comparar: (a, b) => a.precio - b.precio },
  'precio-desc': { texto: 'Precio: mayor a menor', comparar: (a, b) => b.precio - a.precio },
  nombre: { texto: 'Nombre (A-Z)', comparar: (a, b) => a.nombre.localeCompare(b.nombre, 'es') },
};

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
  const [orden, setOrden] = useState('destacados');
  const [visibleCount, setVisibleCount] = useState(PRODUCTOS_POR_PAGINA);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  useDocumentTitle(titulo);

  const { productos, cargando, error } = useProductos();

  const productosCategoria = useMemo(
    () => productos.filter((p) => p.categoria === categoriaSlug),
    [productos, categoriaSlug]
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

  const productosOrdenados = ORDENES[orden]
    ? [...productosFiltrados].sort(ORDENES[orden].comparar)
    : productosFiltrados;
  const productosVisibles = productosOrdenados.slice(0, visibleCount);
  const hayMasProductos = visibleCount < productosFiltrados.length;

  // Si cambia el filtro o la búsqueda, volvemos a mostrar la primera tanda
  useEffect(() => {
    setVisibleCount(PRODUCTOS_POR_PAGINA);
  }, [filtroSeleccionado, busqueda, orden]);

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
              <label className="sort-by">
                Ordenar por:
                <select value={orden} onChange={(e) => setOrden(e.target.value)}>
                  <option value="destacados">{ordenarPorTexto}</option>
                  {Object.entries(ORDENES).map(([valor, { texto }]) => (
                    <option key={valor} value={valor}>{texto}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {cargando ? (
            <p className="sin-resultados">Cargando productos…</p>
          ) : error ? (
            <p className="sin-resultados">No pudimos cargar los productos. {error}</p>
          ) : productosFiltrados.length === 0 ? (
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
