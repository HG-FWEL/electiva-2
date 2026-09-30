// src/pages/Productos.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import './Productos.css';

// 1. Array con las 3 imágenes del banner
const bannerImages = [
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80"
];

function Productos() {
  const [currentSlide, setCurrentSlide] = useState(0);
  useDocumentTitle('Productos');

  // 2. Temporizador para cambiar de imagen automáticamente
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prevIndex) => (prevIndex + 1) % bannerImages.length);
    }, 3500); // 3.5 segundos por imagen

    return () => clearInterval(timer); // Limpieza de memoria al desmontar
  }, []);

  return (
    <div className="productos-layout">
      {/* COLUMNA 1: CATEGORÍAS */}
      <aside className="categories-sidebar">
        <h3 className="categories-title">CATEGORÍAS</h3>
        <ul className="categories-list">
          <li><Link to="/computadores">Computadores</Link></li>
          <li><Link to="/consolas">Consolas</Link></li>
          <li><Link to="/tablets">Tablets</Link></li>
          <li><Link to="/celulares">Celulares</Link></li>
          <li><Link to="/apple-watch">Apple Watch</Link></li>
          <li><Link to="/accesorios">Accesorios</Link></li>
        </ul>
      </aside>

      {/* COLUMNA 2: CONTENIDO CENTRAL */}
      <section className="main-products-section">
        {/* BANNER DINÁMICO */}
        <div 
          className="hero-banner"
          style={{ 
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url('${bannerImages[currentSlide]}')` 
          }}
        >
          <div className="banner-content">
            {/* Puntos indicadores del carrusel */}
            <div className="carousel-dots">
              {bannerImages.map((_, index) => (
                <span 
                  key={index} 
                  className={`dot ${currentSlide === index ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                ></span>
              ))}
            </div>
          </div>
        </div>

        {/* GRILLA DE PRODUCTOS DESTACADOS / MÁS VENDIDOS */}
        <div className="products-grid">
          <Link to="/apple-watch" className="product-card">
            <img 
              src="/apple watch series 11.jpg" 
              alt="Apple Watch" 
            />
          </Link>

          <Link to="/celulares" className="product-card">
            <img 
              src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80" 
              alt="Celular" 
            />
          </Link>

          <Link to="/consolas" className="product-card">
            <img 
              src="https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=400&q=80" 
              alt="Consola" 
            />
          </Link>
        </div>
      </section>

      {/* COLUMNA 3: BANNER PROMOCIONAL */}
      <aside className="promo-card">
        <div className="promo-image-container">
          <img 
            src="https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=500&q=80" 
            alt="AirPods" 
          />
        </div>
        <Link to="/accesorios">
          <button className="btn-discount">Get 15% Discount</button>
        </Link>
      </aside>
    </div>
  );
}

export default Productos;