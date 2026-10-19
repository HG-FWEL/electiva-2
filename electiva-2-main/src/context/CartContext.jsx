// src/context/CartContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useProductos } from './ProductosContext';

const CartContext = createContext();

const CARRITO_KEY = 'movimarket_carrito';
const FAVORITOS_KEY = 'movimarket_favoritos';

// Lee datos guardados en localStorage de forma segura (nunca revienta la app
// si el navegador bloquea el storage o el JSON está corrupto).
function leerAlmacenado(clave) {
  try {
    const guardado = window.localStorage.getItem(clave);
    return guardado ? JSON.parse(guardado) : [];
  } catch (error) {
    console.warn(`No se pudo leer "${clave}" de localStorage:`, error);
    return [];
  }
}

function guardarAlmacenado(clave, valor) {
  try {
    window.localStorage.setItem(clave, JSON.stringify(valor));
  } catch (error) {
    console.warn(`No se pudo guardar "${clave}" en localStorage:`, error);
  }
}

export function CartProvider({ children }) {
  const { productos, cargando, error } = useProductos();
  // Lo que eligió el cliente: [{ id, cantidad, ...copia del producto }]. La copia
  // solo se usa si el catálogo no se pudo cargar; si no, manda el catálogo.
  const [carritoGuardado, setCarritoGuardado] = useState(() => leerAlmacenado(CARRITO_KEY));
  const [favoritos, setFavoritos] = useState(() => leerAlmacenado(FAVORITOS_KEY));
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Persistir carrito y favoritos cada vez que cambian
  useEffect(() => {
    guardarAlmacenado(CARRITO_KEY, carritoGuardado);
  }, [carritoGuardado]);

  useEffect(() => {
    guardarAlmacenado(FAVORITOS_KEY, favoritos);
  }, [favoritos]);

  // El carrito que ve el cliente, con precio, nombre y stock actuales del backend:
  // - disponible: false si el producto ya no existe o se agotó (no se cobra).
  // - ajustado: true si pidió más unidades de las que quedan (se recorta al stock).
  const catalogoListo = !cargando && !error;
  const carrito = useMemo(
    () =>
      carritoGuardado.map((item) => {
        const actual = productos.find((p) => p.id === item.id);
        if (!actual) return { ...item, disponible: !catalogoListo, ajustado: false };
        const disponible = actual.stock > 0;
        return {
          ...actual,
          cantidad: disponible ? Math.min(item.cantidad, actual.stock) : item.cantidad,
          disponible,
          ajustado: disponible && item.cantidad > actual.stock,
        };
      }),
    [carritoGuardado, productos, catalogoListo]
  );

  const itemsDisponibles = carrito.filter((item) => item.disponible);
  const hayCambiosEnCarrito = carrito.some((item) => !item.disponible || item.ajustado);

  // Abrir / cerrar el panel del carrito desde cualquier componente
  const abrirCarrito = () => setIsCartOpen(true);
  const cerrarCarrito = () => setIsCartOpen(false);

  // Agregar producto al carrito, respetando el stock disponible
  const agregarAlCarrito = (producto, cantidad = 1) => {
    setCarritoGuardado((prevCarrito) => {
      const stockMax = typeof producto.stock === 'number' ? producto.stock : Infinity;
      const existe = prevCarrito.find((item) => item.id === producto.id);

      if (existe) {
        const nuevaCantidad = Math.min(existe.cantidad + cantidad, stockMax);
        return prevCarrito.map((item) =>
          item.id === producto.id ? { ...item, cantidad: nuevaCantidad } : item
        );
      }

      const cantidadInicial = Math.min(cantidad, stockMax);
      if (cantidadInicial <= 0) return prevCarrito; // sin stock, no se agrega
      return [...prevCarrito, { ...producto, cantidad: cantidadInicial }];
    });
  };

  // Fijar la cantidad de un producto (los selectores ya limitan al stock)
  const actualizarCantidad = (id, cantidad) => {
    setCarritoGuardado((prev) =>
      prev.map((item) => (item.id === id ? { ...item, cantidad: Math.max(1, cantidad) } : item))
    );
  };

  // Quitar por completo un producto del carrito (sin importar la cantidad)
  const quitarProductoDelCarrito = (id) => {
    setCarritoGuardado((prev) => prev.filter((item) => item.id !== id));
  };

  // Quitar los productos que ya no se pueden comprar
  const quitarNoDisponibles = () => {
    const idsNoDisponibles = new Set(carrito.filter((item) => !item.disponible).map((item) => item.id));
    setCarritoGuardado((prev) => prev.filter((item) => !idsNoDisponibles.has(item.id)));
  };

  // Vaciar carrito
  const vaciarCarrito = () => setCarritoGuardado([]);

  // --- Favoritos ---
  const estaEnFavoritos = (id) => favoritos.some((item) => item.id === id);

  const alternarFavorito = (producto) => {
    setFavoritos((prev) =>
      prev.some((item) => item.id === producto.id)
        ? prev.filter((item) => item.id !== producto.id)
        : [...prev, producto]
    );
  };

  // Totales: solo cuentan los productos que de verdad se pueden comprar
  const totalItems = itemsDisponibles.reduce((acc, item) => acc + item.cantidad, 0);
  const totalPrecio = itemsDisponibles.reduce((acc, item) => acc + Number(item.precio) * item.cantidad, 0);

  return (
    <CartContext.Provider
      value={{
        carrito,
        itemsDisponibles,
        hayCambiosEnCarrito,
        agregarAlCarrito,
        actualizarCantidad,
        quitarProductoDelCarrito,
        quitarNoDisponibles,
        vaciarCarrito,
        totalItems,
        totalPrecio,
        isCartOpen,
        abrirCarrito,
        cerrarCarrito,
        favoritos,
        estaEnFavoritos,
        alternarFavorito,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
