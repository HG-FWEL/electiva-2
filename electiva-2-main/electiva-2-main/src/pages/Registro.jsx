// src/pages/Registro.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import './Auth.css';

function Registro() {
  const { registrarUsuario } = useAuth();
  const navigate = useNavigate();
  useDocumentTitle('Crear cuenta');

  const [datos, setDatos] = useState({ nombre: '', email: '', password: '', confirmar: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleChange = (campo) => (e) => {
    setDatos((prev) => ({ ...prev, [campo]: e.target.value }));
  };

  const validar = () => {
    if (!datos.nombre.trim()) return 'Ingresa tu nombre completo.';
    if (!/^\S+@\S+\.\S+$/.test(datos.email)) return 'Ingresa un correo válido.';
    if (datos.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (datos.password !== datos.confirmar) return 'Las contraseñas no coinciden.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const mensajeError = validar();
    if (mensajeError) {
      setError(mensajeError);
      return;
    }

    setError('');
    setCargando(true);
    const resultado = await registrarUsuario(datos);
    setCargando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    navigate('/', { replace: true });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Crear cuenta</h1>
        <p className="auth-subtitulo">Regístrate para comprar y guardar tus favoritos.</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="auth-error">{error}</div>}

          <label>
            Nombre completo
            <input
              type="text"
              value={datos.nombre}
              onChange={handleChange('nombre')}
              placeholder="Tu nombre"
              autoComplete="name"
            />
          </label>

          <label>
            Correo electrónico
            <input
              type="email"
              value={datos.email}
              onChange={handleChange('email')}
              placeholder="tucorreo@ejemplo.com"
              autoComplete="email"
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              value={datos.password}
              onChange={handleChange('password')}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
            />
          </label>

          <label>
            Confirmar contraseña
            <input
              type="password"
              value={datos.confirmar}
              onChange={handleChange('confirmar')}
              placeholder="Repite tu contraseña"
              autoComplete="new-password"
            />
          </label>

          <button type="submit" className="btn-auth-submit" disabled={cargando}>
            {cargando ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-pie">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}

export default Registro;
