import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { CartProvider, useCart } from './context/CartContext';
import { ProductosProvider } from './context/ProductosContext';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import Login from './pages/Login';
import Registro from './pages/Registro';
import Admin from './pages/Admin';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCartShopping,
  faHeart,
  faMagnifyingGlass,
  faUser,
  faUserShield,
  faGears,
  faTruckFast,
  faCreditCard,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import { categorias } from './data/Productos';

// Simula un ícono "duotone" (fondo suave + trazo nítido) con el paquete gratuito
// de Font Awesome, ya que fa-duotone real requiere una licencia Pro.
function IconoDuotone({ icon }) {
  return (
    <span className="icono-duotone" aria-hidden="true">
      <FontAwesomeIcon icon={icon} className="icono-duotone-fondo" />
      <FontAwesomeIcon icon={icon} className="icono-duotone-frente" />
    </span>
  );
}

function NavbarContent({ onOpenCart }) {
  const { totalItems, favoritos } = useCart();
  const { usuarioActual, esAdmin, cerrarSesion } = useAuth();
  const [busqueda, setBusqueda] = useState('');
  const navigate = useNavigate();

  const handleBuscar = (e) => {
    e.preventDefault();
    if (busqueda.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(busqueda.trim())}`);
    }
  };

  const handleCerrarSesion = () => {
    cerrarSesion();
    navigate('/');
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

        {usuarioActual ? (
          <div className="nav-cuenta">
            <span className="nav-cuenta-nombre">
              {esAdmin ? (
                <FontAwesomeIcon icon={faUserShield} className="icono-usuario-admin" />
              ) : (
                <IconoDuotone icon={faUser} />
              )}
              {usuarioActual.nombre.split(' ')[0]}
            </span>
            {esAdmin && (
              <Link to="/admin" className="nav-admin-link" title="Panel de administración" aria-label="Panel de administración">
                <IconoDuotone icon={faGears} />
              </Link>
            )}
            <button type="button" className="nav-cerrar-sesion" onClick={handleCerrarSesion}>
              Cerrar sesión
            </button>
          </div>
        ) : (
          <div className="nav-cuenta">
            <Link to="/login" className="nav-ingresar">
              <FontAwesomeIcon icon={faUser} /> Ingresar
            </Link>
            <Link to="/registro" className="nav-crear-cuenta">Crear cuenta</Link>
          </div>
        )}
      </nav>
    </header>
  );
}

function RutaAdmin({ children }) {
  const { usuarioActual, esAdmin, listo } = useAuth();

  if (!listo) return null;
  if (!usuarioActual) return <Navigate to="/login" state={{ from: '/admin' }} replace />;
  if (!esAdmin) return <Navigate to="/" replace />;
  return children;
}

// PIE DE PÁGINA: todas las categorías, accesos de cuenta y garantías de compra
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h2>MóvilMarket</h2>
          <p>Tu tienda de tecnología y telefonía de confianza: productos originales, envío a todo el país y pago seguro.</p>
        </div>

        <nav className="footer-col" aria-label="Categorías">
          <h4>Categorías</h4>
          <ul>
            {categorias.map((cat) => (
              <li key={cat.slug}><Link to={cat.ruta}>{cat.nombre}</Link></li>
            ))}
          </ul>
        </nav>

        <nav className="footer-col" aria-label="Tu cuenta">
          <h4>Tu cuenta</h4>
          <ul>
            <li><Link to="/productos">Todos los productos</Link></li>
            <li><Link to="/favoritos">Favoritos</Link></li>
            <li><Link to="/checkout">Finalizar compra</Link></li>
            <li><Link to="/login">Ingresar</Link></li>
            <li><Link to="/registro">Crear cuenta</Link></li>
          </ul>
        </nav>

        <div className="footer-col">
          <h4>Compra segura</h4>
          <ul>
            <li><FontAwesomeIcon icon={faTruckFast} />Envío estándar gratis</li>
            <li><FontAwesomeIcon icon={faCreditCard} />Pago seguro con Wompi</li>
            <li><FontAwesomeIcon icon={faShieldHalved} />Garantía oficial</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} MóvilMarket. Todos los derechos reservados.</span>
        <span>Hecho en Colombia</span>
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
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route
          path="/admin"
          element={
            <RutaAdmin>
              <Admin />
            </RutaAdmin>
          }
        />
      </Routes>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProductosProvider>
        <CartProvider>
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </CartProvider>
      </ProductosProvider>
    </AuthProvider>
  );
}

export default App;
