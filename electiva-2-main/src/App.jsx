import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { CartProvider, useCart } from './context/CartContext';
import { AdminProductsProvider } from './context/AdminProductsContext';
import CarritoModal from './components/CarritoModal';
import Inicio from './pages/Inicio';
import Productos from './pages/Productos';
import Computadores from './pages/Computadores';
import Escritorio from './pages/Escritorio';
import AllInOne from './pages/AllInOne';
import Gaming from './pages/Gaming';
import Accesorios from './pages/Accesorios';
import Consolas from './pages/Consolas';
import Tablets from './pages/Tablets';
import Celulares from './pages/Celulares';
import AppleWatch from './pages/Apple watch';
import DetalleProducto from './pages/DetalleProducto';
import Checkout from './pages/Checkout';
import Favoritos from './pages/Favoritos';
import Buscar from './pages/Buscar';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping, faHeart, faMagnifyingGlass} from '@fortawesome/free-solid-svg-icons';


function NavbarContent({ onOpenCart }) {
  const { totalItems, favoritos } = useCart();
  const [busqueda, setBusqueda] = useState('');
  const navigate = useNavigate();

  const handleBuscar = (e) => {
    e.preventDefault();
    if (busqueda.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(busqueda.trim())}`);
    }
  };

  return (
    <header className="navbar">
      <div className="logo">MóvilMarket</div>

      <form className="navbar-buscador" onSubmit={handleBuscar}>
        <input
          type="text"
          placeholder="Buscar productos…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button type="submit" aria-label="Buscar"><FontAwesomeIcon icon={faMagnifyingGlass} /></button>
      </form>

      <nav className="nav-links">
        <Link to="/">Inicio</Link>
        <Link to="/productos">Productos</Link>
        <Link to="/favoritos" className="nav-icono-link">
          <FontAwesomeIcon icon={faHeart} /> {favoritos.length > 0 && <span className="nav-badge">{favoritos.length}</span>}
        </Link>
        <button onClick={onOpenCart} className="nav-carrito-btn">
         <FontAwesomeIcon icon={faCartShopping} /> <span className="nav-badge">{totalItems}</span>
        </button>
      </nav>
    </header>
  );
}

// COMPONENTE PIE DE PÁGINA (FOOTER)
function Footer() {
  return (
    <footer className="footer-container" style={{ background: '#0f172a', color: '#cbd5e1', padding: '2rem 5%', marginTop: '3rem', textAlign: 'center' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ color: '#00d1a0', marginBottom: '0.5rem' }}>MóvilMarket</h3>
          <p style={{ fontSize: '0.9rem' }}>Tu tienda de tecnología y telefonía de confianza.</p>
        </div>
        <div>
          <h4 style={{ color: '#ffffff', marginBottom: '0.5rem' }}>Navegación</h4>
          <p style={{ fontSize: '0.85rem' }}>
            <Link to="/celulares" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Celulares</Link> |{' '}
            <Link to="/computadores" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Computadores</Link> |{' '}
            <Link to="/favoritos" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Favoritos</Link>
          </p>
        </div>
      </div>
      <div style={{ borderTop: '1px solid #334155', marginTop: '1.5rem', paddingTop: '1rem', fontSize: '0.8rem' }}>
        © {new Date().getFullYear()} MóvilMarket. Todos los derechos reservados.
      </div>
    </footer>
  );
}

function AppShell() {
  const { isCartOpen, abrirCarrito, cerrarCarrito } = useCart();

  return (
    <div className="page-container">
      <NavbarContent onOpenCart={abrirCarrito} />
      <CarritoModal isOpen={isCartOpen} onClose={cerrarCarrito} />

      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/computadores" element={<Computadores />} />
        <Route path="/escritorio" element={<Escritorio />} />
        <Route path="/all-in-one" element={<AllInOne />} />
        <Route path="/gaming" element={<Gaming />} />
        <Route path="/accesorios" element={<Accesorios />} />
        <Route path="/consolas" element={<Consolas />} />
        <Route path="/tablets" element={<Tablets />} />
        <Route path="/celulares" element={<Celulares />} />
        <Route path="/apple-watch" element={<AppleWatch />} />
        <Route path="/producto/:id" element={<DetalleProducto />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/favoritos" element={<Favoritos />} />
        <Route path="/buscar" element={<Buscar />} />
      </Routes>

      {/* PIE DE PÁGINA AHORA VISIBLE EN TODAS LAS RUTAS */}
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AdminProductsProvider>
      <CartProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </CartProvider>
    </AdminProductsProvider>
  );
}

export default App;
