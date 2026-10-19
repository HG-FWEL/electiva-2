// src/context/ProductosContext.jsx
// El catálogo vive en el backend (GET /api/productos). Este contexto lo carga
// una vez al abrir la tienda y lo comparte con todas las páginas; las acciones
// del panel de admin lo modifican en el backend y actualizan la copia local.
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { pedirApi } from '../utils/api';

const ProductosContext = createContext();

export function ProductosProvider({ children }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const recargarProductos = useCallback(async () => {
    try {
      setProductos(await pedirApi('/api/productos'));
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargarProductos();
  }, [recargarProductos]);

  const agregarProducto = async (datos) => {
    const nuevo = await pedirApi('/api/productos', { metodo: 'POST', cuerpo: datos });
    setProductos((prev) => [...prev, nuevo]);
    return nuevo;
  };

  const editarProducto = async (id, cambios) => {
    const actualizado = await pedirApi(`/api/productos/${encodeURIComponent(id)}`, { metodo: 'PUT', cuerpo: cambios });
    setProductos((prev) => prev.map((p) => (p.id === id ? actualizado : p)));
    return actualizado;
  };

  const eliminarProducto = async (id) => {
    await pedirApi(`/api/productos/${encodeURIComponent(id)}`, { metodo: 'DELETE' });
    setProductos((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <ProductosContext.Provider
      value={{ productos, cargando, error, recargarProductos, agregarProducto, editarProducto, eliminarProducto }}
    >
      {children}
    </ProductosContext.Provider>
  );
}

export const useProductos = () => useContext(ProductosContext);
