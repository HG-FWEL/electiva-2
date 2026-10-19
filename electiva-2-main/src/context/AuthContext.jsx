// src/context/AuthContext.jsx
// La sesión la valida el backend (/api/auth): aquí solo se guarda el token y
// los datos públicos del usuario. Las contraseñas nunca se guardan en el navegador.
import React, { createContext, useContext, useState, useEffect } from 'react';
import { pedirApi, leerToken, guardarToken, EVENTO_SESION_EXPIRADA } from '../utils/api';

const AuthContext = createContext();

// Datos que guardaba la versión anterior (cuentas y hashes en el navegador).
const CLAVES_ANTIGUAS = ['movimarket_usuarios', 'movimarket_sesion'];

export function AuthProvider({ children }) {
  const [usuarioActual, setUsuarioActual] = useState(null);
  // false mientras se comprueba con el backend si el token guardado sigue vigente
  const [listo, setListo] = useState(false);

  useEffect(() => {
    try {
      CLAVES_ANTIGUAS.forEach((clave) => window.localStorage.removeItem(clave));
    } catch {
      // Sin acceso al storage no hay nada que limpiar.
    }

    if (!leerToken()) {
      setListo(true);
      return;
    }
    pedirApi('/api/auth/yo')
      .then(setUsuarioActual)
      .catch(() => guardarToken(null))
      .finally(() => setListo(true));
  }, []);

  // Si cualquier petición recibe 401, la sesión venció: se cierra en toda la app.
  useEffect(() => {
    const alExpirar = () => setUsuarioActual(null);
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
  }, []);

  const abrirSesion = async (ruta, cuerpo) => {
    try {
      const { token, usuario } = await pedirApi(ruta, { metodo: 'POST', cuerpo });
      guardarToken(token);
      setUsuarioActual(usuario);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  };

  const registrarUsuario = ({ nombre, email, password }) =>
    abrirSesion('/api/auth/registro', { nombre, email, password });

  const iniciarSesion = ({ email, password }) => abrirSesion('/api/auth/login', { email, password });

  const cerrarSesion = () => {
    guardarToken(null);
    setUsuarioActual(null);
  };

  const esAdmin = usuarioActual?.rol === 'admin';

  return (
    <AuthContext.Provider
      value={{
        usuarioActual,
        esAdmin,
        listo,
        registrarUsuario,
        iniciarSesion,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
