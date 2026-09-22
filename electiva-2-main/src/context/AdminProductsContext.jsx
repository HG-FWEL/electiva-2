// src/context/AdminProductsContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { productos as productosEstaticos } from '../data/Productos';

const AdminProductsContext = createContext();

const ADMIN_PRODUCTOS_KEY = 'movimarket_productos_admin';
const ADMIN_SESION_KEY = 'movimarket_admin_sesion';

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

export function AdminProductsProvider({ children }) {
  const [productosAdmin, setProductosAdmin] = useState(() => leerAlmacenado(ADMIN_PRODUCTOS_KEY, []));
  const [sesionAdmin, setSesionAdmin] = useState(() => leerAlmacenado(ADMIN_SESION_KEY, false));

  useEffect(() => {
    guardarAlmacenado(ADMIN_PRODUCTOS_KEY, productosAdmin);
  }, [productosAdmin]);

  useEffect(() => {
    guardarAlmacenado(ADMIN_SESION_KEY, sesionAdmin);
  }, [sesionAdmin]);

  const agregarProducto = (producto) => {
    const nuevoProducto = {
      ...producto,
      id: `admin-${Date.now()}`,
      esPersonalizado: true,
    };
    setProductosAdmin((prev) => [...prev, nuevoProducto]);
    return nuevoProducto;
  };

  const editarProducto = (id, cambios) => {
    setProductosAdmin((prev) => prev.map((p) => (p.id === id ? { ...p, ...cambios } : p)));
  };

  const eliminarProducto = (id) => {
    setProductosAdmin((prev) => prev.filter((p) => p.id !== id));
  };

  const iniciarSesionAdmin = () => setSesionAdmin(true);
  const cerrarSesionAdmin = () => setSesionAdmin(false);

  // Catálogo completo que usa el resto de la tienda: productos "de fábrica" +
  // los que se agregaron desde el panel de administración.
  const catalogoCompleto = [...productosEstaticos, ...productosAdmin];

  return (
    <AdminProductsContext.Provider
      value={{
        productosAdmin,
        catalogoCompleto,
        agregarProducto,
        editarProducto,
        eliminarProducto,
        sesionAdmin,
        iniciarSesionAdmin,
        cerrarSesionAdmin,
      }}
    >
      {children}
    </AdminProductsContext.Provider>
  );
}

export const useAdminProducts = () => useContext(AdminProductsContext);
