// src/pages/Inicio.jsx
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useProductos } from '../context/ProductosContext';
import { formatPrecioCOP } from '../utils/precio';
import { ICONOS_CATEGORIA, resumenCategorias, productosDestacados } from '../utils/categorias';
import Modelo3DViewer from '../components/Modelo3DViewer';
import ProductCard from '../components/ProductCard';
import ProductoModal from '../components/ProductoModal';
import './Inicio.css';
import '../components/Esqueleto.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTruckFast, faCreditCard, faShield, faArrowRight } from '@fortawesome/free-solid-svg-icons';

// Tarjetas grandes del bento: el texto es fijo; cantidad y precio salen del catálogo.
const BENTO = [
  {
    slug: 'computadores',
    titulo: 'MacBook & Portátiles',
    texto: 'Rendimiento pro para llevar a donde sea.',
    imagen: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80',
    tema: 'bento-dark',
  },
  {
    slug: 'consolas',
    titulo: 'Consolas Gaming',
    texto: 'Gráficos de última generación a 120 FPS.',
    imagen: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=500&q=80',
    tema: 'bento-light',
  },
  {
    slug: 'tablets',
    titulo: 'Tablets Pro',
    texto: 'Tu próximo estudio de diseño portátil.',
    imagen: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=500&q=80',
    tema: 'bento-light',
  },
  {
    slug: 'apple-watch',
    titulo: 'Apple Watch',
    texto: 'Salud, deporte y conectividad en tu muñeca.',
    imagen: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=500&q=80',
    tema: 'bento-dark',
  },
];

function textoCategoria(cat) {
  if (!cat || cat.cantidad === 0) return null;
  return `${cat.cantidad} producto${cat.cantidad === 1 ? '' : 's'} · desde ${formatPrecioCOP(cat.desde)}`;
}

function Inicio() {
  const { agregarAlCarrito } = useCart();
  const navigate = useNavigate();
  const { productos, cargando } = useProductos();
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  useDocumentTitle('Inicio');

  const comprarDesdeInicio = (producto) => {
    agregarAlCarrito(producto);
    navigate('/checkout');
  };

  // Productos de los banners (tomados del catálogo del backend, así el precio, el
  // id y el stock quedan sincronizados). Mientras carga son undefined.
  const productoHeroPrincipal = productos.find((p) => p.id === 'cel-1'); // iPhone 15 Pro Max
  const productoHeroSecundario = productos.find((p) => p.id === 'cel-4'); // Samsung Galaxy S24 Ultra

  const resumen = useMemo(() => resumenCategorias(productos), [productos]);
  const resumenPorSlug = useMemo(() => Object.fromEntries(resumen.map((c) => [c.slug, c])), [resumen]);
  const destacados = useMemo(() => productosDestacados(productos, 8), [productos]);

  return (
    <div className="inicio-container">

      {/* 1. HERO PRINCIPAL (ESTILO OSCURO - TITULAR DEL MOMENTO) */}
      <section className="hero-apple hero-dark">
        <div className="hero-apple-content">
          <span className="badge-apple">Nuevo lanzamiento</span>
          <h1 className="hero-apple-title">iPhone 15 Pro Max</h1>
          <p className="hero-apple-subtitle">Titanio. Tan fuerte. Tan ligero. Tan Pro.</p>
          <p className="hero-apple-precio">
            {productoHeroPrincipal ? formatPrecioCOP(productoHeroPrincipal.precio) : ' '}
          </p>
          <div className="hero-apple-actions">
            <button
              type="button"
              className="btn-apple-primary"
              onClick={() => comprarDesdeInicio(productoHeroPrincipal)}
              disabled={!productoHeroPrincipal || productoHeroPrincipal.stock <= 0}
            >
              Comprar
            </button>
            <Link to="/producto/cel-1" className="btn-apple-secondary">Ver detalles</Link>
          </div>
        </div>
        <div className="hero-apple-media">
          {productoHeroPrincipal &&
            (productoHeroPrincipal.modelo3d ? (
              <Modelo3DViewer ruta={productoHeroPrincipal.modelo3d} alt="iPhone 15 Pro Max" alto="400px" />
            ) : (
              <img src={productoHeroPrincipal.imagen} alt="iPhone 15 Pro Max" />
            ))}
        </div>
      </section>

      {/* 2. EXPLORA POR CATEGORÍA */}
      <section className="inicio-categorias" aria-labelledby="titulo-categorias">
        <h2 id="titulo-categorias" className="inicio-seccion-titulo">Explora por categoría</h2>
        <div className="inicio-categorias-fila">
          {resumen.map((cat) => (
            <Link key={cat.slug} to={cat.ruta} className="inicio-categoria">
              <span className="inicio-categoria-icono">
                <FontAwesomeIcon icon={ICONOS_CATEGORIA[cat.slug]} />
              </span>
              <span className="inicio-categoria-nombre">{cat.nombre}</span>
              <span className="inicio-categoria-cantidad">
                {cargando ? ' ' : `${cat.cantidad} producto${cat.cantidad === 1 ? '' : 's'}`}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. HERO SECUNDARIO (ESTILO CLARO - CONTRASTE ELEGANTE) */}
      <section className="hero-apple hero-light">
        <div className="hero-apple-content">
          <span className="badge-apple badge-dark">Potencia sin límites</span>
          <h2 className="hero-apple-title">Galaxy S24 Ultra</h2>
          <p className="hero-apple-subtitle">Con Inteligencia Artificial integrada y pantalla AMOLED 120Hz.</p>
          <p className="hero-apple-precio">
            {productoHeroSecundario ? formatPrecioCOP(productoHeroSecundario.precio) : ' '}
          </p>
          <div className="hero-apple-actions">
            <button
              type="button"
              className="btn-apple-dark"
              onClick={() => comprarDesdeInicio(productoHeroSecundario)}
              disabled={!productoHeroSecundario || productoHeroSecundario.stock <= 0}
            >
              Comprar
            </button>
            <Link to="/producto/cel-4" className="btn-apple-outline">Ver detalles</Link>
          </div>
        </div>
        <div className="hero-apple-media">
          {productoHeroSecundario && <img src={productoHeroSecundario.imagen} alt="Galaxy S24 Ultra" />}
        </div>
      </section>

      {/* 4. DESTACADOS (productos reales del catálogo) */}
      <section className="inicio-destacados" aria-labelledby="titulo-destacados">
        <div className="inicio-destacados-cabecera">
          <div>
            <h2 id="titulo-destacados" className="inicio-seccion-titulo">Destacados de la semana</h2>
            <p>Una selección de cada categoría, lista para llegar a tu casa.</p>
          </div>
          <Link to="/productos" className="link-apple">
            Ver todo <FontAwesomeIcon icon={faArrowRight} />
          </Link>
        </div>
        <div className="inicio-destacados-grid">
          {cargando
            ? Array.from({ length: 4 }, (_, i) => <div key={i} className="esqueleto inicio-esqueleto-tarjeta" />)
            : destacados.map((producto) => (
                <ProductCard key={producto.id} producto={producto} onSeleccionar={setProductoSeleccionado} />
              ))}
        </div>
      </section>

      {/* 5. BENTO GRID (2 COLUMNAS ESTILO APPLE) */}
      <section className="bento-grid-section">
        <div className="bento-grid">
          {BENTO.map((tarjeta) => {
            const cat = resumenPorSlug[tarjeta.slug];
            return (
              <Link key={tarjeta.slug} to={cat?.ruta ?? '/productos'} className={`bento-card ${tarjeta.tema}`}>
                <div className="bento-card-content">
                  <h3>{tarjeta.titulo}</h3>
                  <p>{tarjeta.texto}</p>
                  <span className="bento-card-dato">{textoCategoria(cat) ?? ' '}</span>
                  <span className="link-apple">
                    Ver catálogo <FontAwesomeIcon icon={faArrowRight} />
                  </span>
                </div>
                <div className="bento-card-img">
                  <img src={tarjeta.imagen} alt={tarjeta.titulo} loading="lazy" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 6. FRANJA DE BENEFICIOS */}
      <section className="beneficios-section">
        <div className="beneficios-container">
          <div className="beneficio-item">
            <div className="beneficio-icon"><FontAwesomeIcon icon={faTruckFast} /></div>
            <h4>Envío gratis</h4>
            <p>Envío estándar gratis en todas tus compras, o express en 24 a 48 horas.</p>
          </div>
          <div className="beneficio-item">
            <div className="beneficio-icon"><FontAwesomeIcon icon={faShield} /></div>
            <h4>Garantía oficial</h4>
            <p>100% productos originales con soporte del fabricante.</p>
          </div>
          <div className="beneficio-item">
            <div className="beneficio-icon"><FontAwesomeIcon icon={faCreditCard} /></div>
            <h4>Pago seguro con Wompi</h4>
            <p>Tus datos de pago nunca pasan por nuestra tienda.</p>
          </div>
        </div>
      </section>

      <ProductoModal producto={productoSeleccionado} onClose={() => setProductoSeleccionado(null)} />
    </div>
  );
}

export default Inicio;
