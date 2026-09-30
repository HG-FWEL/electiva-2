// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const USUARIOS_KEY = 'movimarket_usuarios';
const SESION_KEY = 'movimarket_sesion';

const ADMIN_SEED = {
  nombre: 'Administrador MoviMarket',
  email: 'admin@movimarket.com',
  password: 'Admin123!',
};

function leerAlmacenado(clave, valorPorDefecto) {
  try {
    const guardado = window.localStorage.getItem(clave);
    return guardado ? JSON.parse(guardado) : valorPorDefecto;
  } catch (error) {
    console.warn(`No se pudo leer "${clave}" de localStorage:`, error);
    return valorPorDefecto;
  }
}

function guardarAlmacenado(clave, valor) {
  try {
    window.localStorage.setItem(clave, JSON.stringify(valor));
  } catch (error) {
    console.warn(`No se pudo guardar "${clave}" en localStorage:`, error);
  }
}

// Hash de la contraseña con SHA-256 (Web Crypto API) para no guardar texto plano.
async function hashPassword(password) {
  const datos = new TextEncoder().encode(password);
  const buffer = await window.crypto.subtle.digest('SHA-256', datos);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function AuthProvider({ children }) {
  const [usuarios, setUsuarios] = useState(() => leerAlmacenado(USUARIOS_KEY, []));
  const [usuarioActual, setUsuarioActual] = useState(() => leerAlmacenado(SESION_KEY, null));
  const [listo, setListo] = useState(false);

  // Crea el usuario administrador por defecto la primera vez que corre la app.
  useEffect(() => {
    async function inicializar() {
      const yaExiste = usuarios.some(
        (u) => u.email.toLowerCase() === ADMIN_SEED.email.toLowerCase()
      );
      if (!yaExiste) {
        const passwordHash = await hashPassword(ADMIN_SEED.password);
        const admin = {
          id: 'user-admin',
          nombre: ADMIN_SEED.nombre,
          email: ADMIN_SEED.email,
          passwordHash,
          rol: 'admin',
        };
        setUsuarios((prev) => [...prev, admin]);
      }
      setListo(true);
    }
    inicializar();
    // Solo debe ejecutarse una vez al montar la app.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    guardarAlmacenado(USUARIOS_KEY, usuarios);
  }, [usuarios]);

  useEffect(() => {
    guardarAlmacenado(SESION_KEY, usuarioActual);
  }, [usuarioActual]);

  const registrarUsuario = async ({ nombre, email, password }) => {
    const emailNormalizado = email.trim().toLowerCase();
    const existe = usuarios.some((u) => u.email.toLowerCase() === emailNormalizado);
    if (existe) {
      return { ok: false, error: 'Ya existe una cuenta registrada con ese correo.' };
    }
    const passwordHash = await hashPassword(password);
    const nuevoUsuario = {
      id: `user-${Date.now()}`,
      nombre: nombre.trim(),
      email: emailNormalizado,
      passwordHash,
      rol: 'cliente',
    };
    setUsuarios((prev) => [...prev, nuevoUsuario]);
    const sesion = { id: nuevoUsuario.id, nombre: nuevoUsuario.nombre, email: nuevoUsuario.email, rol: nuevoUsuario.rol };
    setUsuarioActual(sesion);
    return { ok: true };
  };

  const iniciarSesion = async ({ email, password }) => {
    const emailNormalizado = email.trim().toLowerCase();
    const usuario = usuarios.find((u) => u.email.toLowerCase() === emailNormalizado);
    if (!usuario) {
      return { ok: false, error: 'No existe una cuenta con ese correo.' };
    }
    const passwordHash = await hashPassword(password);
    if (passwordHash !== usuario.passwordHash) {
      return { ok: false, error: 'La contraseña es incorrecta.' };
    }
    const sesion = { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol };
    setUsuarioActual(sesion);
    return { ok: true };
  };

  const cerrarSesion = () => setUsuarioActual(null);

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
