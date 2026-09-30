// src/context/AdminProductsContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { productos as productosEstaticos } from '../data/Productos';

const AdminProductsContext = createContext();

const ADMIN_PRODUCTOS_KEY = 'movimarket_productos_admin';
const OVERRIDES_KEY = 'movimarket_productos_overrides';
const ELIMINADOS_KEY = 'movimarket_productos_eliminados';

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
  // Cambios aplicados sobre productos del catálogo original: { [id]: { campo: valor, ... } }
  const [overrides, setOverrides] = useState(() => leerAlmacenado(OVERRIDES_KEY, {}));
  // IDs de productos (del catálogo original o creados por un admin) que se ocultaron de la tienda.
  const [eliminados, setEliminados] = useState(() => leerAlmacenado(ELIMINADOS_KEY, []));

  useEffect(() => {
    guardarAlmacenado(ADMIN_PRODUCTOS_KEY, productosAdmin);
  }, [productosAdmin]);

  useEffect(() => {
    guardarAlmacenado(OVERRIDES_KEY, overrides);
  }, [overrides]);

  useEffect(() => {
    guardarAlmacenado(ELIMINADOS_KEY, eliminados);
  }, [eliminados]);

  const esProductoPersonalizado = (id) => productosAdmin.some((p) => p.id === id);

  const agregarProducto = (producto) => {
    const nuevoProducto = {
      ...producto,
      id: `admin-${Date.now()}`,
      esPersonalizado: true,
    };
    setProductosAdmin((prev) => [...prev, nuevoProducto]);
    return nuevoProducto;
  };

  // Funciona tanto para productos creados desde el panel como para los del
  // catálogo original: a estos últimos se les guarda un "override" con los
  // campos modificados, sin tocar el archivo fuente de datos.
  const editarProducto = (id, cambios) => {
    if (esProductoPersonalizado(id)) {
      setProductosAdmin((prev) => prev.map((p) => (p.id === id ? { ...p, ...cambios } : p)));
    } else {
      setOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...cambios } }));
    }
  };

  const eliminarProducto = (id) => {
    if (esProductoPersonalizado(id)) {
      setProductosAdmin((prev) => prev.filter((p) => p.id !== id));
    } else {
      setEliminados((prev) => (prev.includes(id) ? prev : [...prev, id]));
    }
  };

  // Catálogo completo que usa el resto de la tienda: productos "de fábrica"
  // (con sus ediciones aplicadas) + los agregados desde el panel de admin,
  // sin contar los que fueron eliminados.
  const catalogoCompleto = [
    ...productosEstaticos
      .filter((p) => !eliminados.includes(p.id))
      .map((p) => (overrides[p.id] ? { ...p, ...overrides[p.id] } : p)),
    ...productosAdmin.filter((p) => !eliminados.includes(p.id)),
  ];

  return (
    <AdminProductsContext.Provider
      value={{
        productosAdmin,
        catalogoCompleto,
        agregarProducto,
        editarProducto,
        eliminarProducto,
        esProductoPersonalizado,
      }}
    >
      {children}
    </AdminProductsContext.Provider>
  );
}

export const useAdminProducts = () => useContext(AdminProductsContext);
