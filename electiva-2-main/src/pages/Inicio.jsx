// src/pages/Inicio.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { productos } from '../data/Productos';
import { formatPrecioCOP } from '../utils/precio';
import Modelo3DViewer from '../components/Modelo3DViewer';
import './Inicio.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTruckFast, faCreditCard, faShield } from '@fortawesome/free-solid-svg-icons';

function Inicio() {
  const { agregarAlCarrito, abrirCarrito } = useCart();
  useDocumentTitle('Inicio');

  const comprarDesdeInicio = (producto) => {
    agregarAlCarrito(producto);
    abrirCarrito();
  };

  // Productos destacados para comprar directamente (tomados del catálogo central,
  // así el precio, el id y el stock quedan siempre sincronizados con el resto de la tienda)
  const productoHeroPrincipal = productos.find((p) => p.id === 'cel-1'); // iPhone 15 Pro Max
  const productoHeroSecundario = productos.find((p) => p.id === 'cel-4'); // Samsung Galaxy S24 Ultra

  return (
    <div className="inicio-container">

      {/* 1. HERO PRINCIPAL (ESTILO OSCURO - TITULAR DEL MOMENTO) */}
      <section className="hero-apple hero-dark">
        <div className="hero-apple-content">
          <span className="badge-apple">NUEVO LANZAMIENTO</span>
          <h1 className="hero-apple-title">iPhone 15 Pro Max</h1>
          <p className="hero-apple-subtitle">Titanio. Tan fuerte. Tan ligero. Tan Pro.</p>
          <div className="hero-apple-actions">
            <Link to="/celulares" className="btn-apple-primary">Más información</Link>
            <button 
              type="button" 
              className="btn-apple-secondary"
              onClick={() => comprarDesdeInicio(productoHeroPrincipal)}
            >
              Comprar ({formatPrecioCOP(productoHeroPrincipal.precio)})
            </button>
          </div>
        </div>
        <div className="hero-apple-media">
          {productoHeroPrincipal.modelo3d ? (
            <Modelo3DViewer ruta={productoHeroPrincipal.modelo3d} alt="iPhone 15 Pro Max" alto="420px" />
          ) : (
            <img src={productoHeroPrincipal.imagen} alt="iPhone 15 Pro Max" />
          )}
        </div>
      </section>

      {/* 2. HERO SECUNDARIO (ESTILO CLARO - CONTRASTE ELEGANTE) */}
      <section className="hero-apple hero-light">
        <div className="hero-apple-content">
          <span className="badge-apple badge-dark">POTENCIA SIN LÍMITES</span>
          <h2 className="hero-apple-title">Galaxy S24 Ultra</h2>
          <p className="hero-apple-subtitle">Con Inteligencia Artificial integrada y pantalla AMOLED 120Hz.</p>
          <div className="hero-apple-actions">
            <Link to="/celulares" className="btn-apple-dark">Más información</Link>
            <button 
              type="button" 
              className="btn-apple-outline"
              onClick={() => comprarDesdeInicio(productoHeroSecundario)}
            >
              Comprar ({formatPrecioCOP(productoHeroSecundario.precio)})
            </button>
          </div>
        </div>
        <div className="hero-apple-media">
          <img src={productoHeroSecundario.imagen} alt="Galaxy S24 Ultra" />
        </div>
      </section>

      {/* 3. BENTO GRID (2 COLUMNAS ESTILO APPLE) */}
      <section className="bento-grid-section">
        <div className="bento-grid">

          {/* Tarjeta 1: Computadores */}
          <div className="bento-card bento-dark">
            <div className="bento-card-content">
              <h3>MacBook & Portátiles</h3>
              <p>Rendimiento pro para llevar a donde sea.</p>
              <Link to="/computadores" className="link-apple">Ver catálogo &gt;</Link>
            </div>
            <div className="bento-card-img">
              <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80" alt="Computadores" />
            </div>
          </div>

          {/* Tarjeta 2: Consolas */}
          <div className="bento-card bento-light">
            <div className="bento-card-content">
              <h3>Consolas Gaming</h3>
              <p>Gráficos de última generación a 120 FPS.</p>
              <Link to="/consolas" className="link-apple">Explorar consolas &gt;</Link>
            </div>
            <div className="bento-card-img">
              <img src="https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=500&q=80" alt="Consolas" />
            </div>
          </div>

          {/* Tarjeta 3: Tablets */}
          <div className="bento-card bento-light">
            <div className="bento-card-content">
              <h3>Tablets Pro</h3>
              <p>Tu próximo estudio de diseño portátil.</p>
              <Link to="/tablets" className="link-apple">Descubrir más &gt;</Link>
            </div>
            <div className="bento-card-img">
              <img src="https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=500&q=80" alt="Tablets" />
            </div>
          </div>

          {/* Tarjeta 4: Apple Watch */}
          <div className="bento-card bento-dark">
            <div className="bento-card-content">
              <h3>Apple Watch</h3>
              <p>Salud, deporte y conectividad en tu muñeca.</p>
              <Link to="/apple-watch" className="link-apple">Ver modelos &gt;</Link>
            </div>
            <div className="bento-card-img">
              <img src="https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=500&q=80" alt="Apple Watch" />
            </div>
          </div>

        </div>
      </section>

      {/* 4. FRANJA DE BENEFICIOS */}
      <section className="beneficios-section">
        <div className="beneficios-container">
          <div className="beneficio-item">
            <div className="beneficio-icon"><FontAwesomeIcon icon={faTruckFast} /></div>
            <h4>Envío Gratis</h4>
            <p>En todas tus compras superiores a {formatPrecioCOP(100)}</p>
          </div>
          <div className="beneficio-item">
            <div className="beneficio-icon"> <FontAwesomeIcon icon={faShield} /> </div>
            <h4>Garantía Oficial</h4>
            <p>100% productos originales con soporte</p>
          </div>
          <div className="beneficio-item">
            <div className="beneficio-icon"> <FontAwesomeIcon icon={faCreditCard} /></div>
            <h4>Pago Seguro</h4>
            <p>Diferentes medios de pago y financiamiento</p>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Inicio;