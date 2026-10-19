// src/pages/Productos.jsx
// Vitrina de la tienda: carrusel con promociones, todas las categorías con datos
// reales del catálogo y los productos que están por agotarse.
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useProductos } from '../context/ProductosContext';
import { formatPrecioCOP } from '../utils/precio';
import { handleImgError } from '../utils/placeholder';
import { ICONOS_CATEGORIA, resumenCategorias, ultimasUnidades } from '../utils/categorias';
import ProductCard from '../components/ProductCard';
import ProductoModal from '../components/ProductoModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
  faArrowRight,
  faTruckFast,
  faCreditCard,
  faShield,
} from '@fortawesome/free-solid-svg-icons';
import './Productos.css';
import '../components/Esqueleto.css';

const SLIDES = [
  {
    etiqueta: 'Computadores',
    titulo: 'Potencia para trabajar y crear',
    texto: 'MacBook y portátiles con chips de última generación.',
    imagen: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1400&q=80',
    ruta: '/computadores',
  },
  {
    etiqueta: 'Escritorio',
    titulo: 'Tu estación de trabajo ideal',
    texto: 'PCs de escritorio y All-in-One para la oficina o la casa.',
    imagen: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1400&q=80',
    ruta: '/escritorio',
  },
  {
    etiqueta: 'Gaming',
    titulo: 'Juega al siguiente nivel',
    texto: 'Consolas, periféricos y equipos gamer listos para la acción.',
    imagen: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1400&q=80',
    ruta: '/gaming',
  },
];

const INTERVALO_CARRUSEL = 5000;

function Carrusel() {
  const [actual, setActual] = useState(0);
  const [pausado, setPausado] = useState(false);

  // Avanza solo, salvo cuando el mouse o el foco están sobre el carrusel
  useEffect(() => {
    if (pausado) return undefined;
    const timer = setInterval(() => setActual((i) => (i + 1) % SLIDES.length), INTERVALO_CARRUSEL);
    return () => clearInterval(timer);
  }, [pausado]);

  const ir = (indice) => setActual((indice + SLIDES.length) % SLIDES.length);

  return (
    <section
      className="vitrina-carrusel"
      aria-roledescription="carrusel"
      aria-label="Promociones"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      {SLIDES.map((slide, i) => (
        <div
          key={slide.ruta}
          className={`vitrina-slide ${i === actual ? 'activo' : ''}`}
          style={{ backgroundImage: `url('${slide.imagen}')` }}
          aria-hidden={i !== actual}
        >
          <div className="vitrina-slide-texto">
            <span className="vitrina-slide-etiqueta">{slide.etiqueta}</span>
            <h1>{slide.titulo}</h1>
            <p>{slide.texto}</p>
            <Link to={slide.ruta} className="vitrina-slide-boton" tabIndex={i === actual ? 0 : -1}>
              Ver productos <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </div>
        </div>
      ))}

      <button type="button" className="vitrina-flecha vitrina-flecha-izq" onClick={() => ir(actual - 1)} aria-label="Anterior">
        <FontAwesomeIcon icon={faChevronLeft} />
      </button>
      <button type="button" className="vitrina-flecha vitrina-flecha-der" onClick={() => ir(actual + 1)} aria-label="Siguiente">
        <FontAwesomeIcon icon={faChevronRight} />
      </button>

      <div className="vitrina-puntos">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.ruta}
            type="button"
            className={`vitrina-punto ${i === actual ? 'activo' : ''}`}
            onClick={() => ir(i)}
            aria-label={`Ir a ${slide.etiqueta}`}
            aria-current={i === actual}
          />
        ))}
      </div>
    </section>
  );
}

function Productos() {
  const { productos, cargando, error } = useProductos();
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  useDocumentTitle('Productos');

  const resumen = useMemo(() => resumenCategorias(productos), [productos]);
  const escasos = useMemo(() => ultimasUnidades(productos, 8), [productos]);

  return (
    <div className="vitrina">
      <Carrusel />

      <section className="vitrina-seccion" aria-labelledby="titulo-vitrina-categorias">
        <div className="vitrina-seccion-cabecera">
          <h2 id="titulo-vitrina-categorias">Compra por categoría</h2>
          {!cargando && !error && <p>{productos.length} productos en {resumen.filter((c) => c.cantidad > 0).length} categorías</p>}
        </div>

        {error && <p className="vitrina-error">No pudimos cargar el catálogo. {error}</p>}

        <div className="vitrina-categorias">
          {resumen.map((cat) =>
            cargando ? (
              <div key={cat.slug} className="esqueleto vitrina-esqueleto-categoria" />
            ) : (
              <Link key={cat.slug} to={cat.ruta} className="vitrina-categoria">
                <div className="vitrina-categoria-imagen">
                  {cat.imagen ? (
                    <img src={cat.imagen} alt="" loading="lazy" onError={handleImgError} />
                  ) : (
                    <FontAwesomeIcon icon={ICONOS_CATEGORIA[cat.slug]} />
                  )}
                </div>
                <div className="vitrina-categoria-info">
                  <span className="vitrina-categoria-icono">
                    <FontAwesomeIcon icon={ICONOS_CATEGORIA[cat.slug]} />
                  </span>
                  <h3>{cat.nombre}</h3>
                  <p>
                    {cat.cantidad > 0
                      ? `${cat.cantidad} producto${cat.cantidad === 1 ? '' : 's'} · desde ${formatPrecioCOP(cat.desde)}`
                      : 'Próximamente'}
                  </p>
                </div>
                <FontAwesomeIcon icon={faArrowRight} className="vitrina-categoria-flecha" />
              </Link>
            )
          )}
        </div>
      </section>

      {escasos.length > 0 && (
        <section className="vitrina-seccion" aria-labelledby="titulo-ultimas">
          <div className="vitrina-seccion-cabecera">
            <h2 id="titulo-ultimas">Últimas unidades</h2>
            <p>Estos productos están por agotarse.</p>
          </div>
          <div className="vitrina-productos">
            {escasos.map((producto) => (
              <ProductCard key={producto.id} producto={producto} onSeleccionar={setProductoSeleccionado} />
            ))}
          </div>
        </section>
      )}

      <section className="vitrina-beneficios">
        <div>
          <FontAwesomeIcon icon={faTruckFast} />
          <span><strong>Envío estándar gratis</strong> en todas tus compras</span>
        </div>
        <div>
          <FontAwesomeIcon icon={faCreditCard} />
          <span><strong>Pago seguro</strong> con Wompi</span>
        </div>
        <div>
          <FontAwesomeIcon icon={faShield} />
          <span><strong>Garantía oficial</strong> en todos los productos</span>
        </div>
      </section>

      <ProductoModal producto={productoSeleccionado} onClose={() => setProductoSeleccionado(null)} />
    </div>
  );
}

export default Productos;
