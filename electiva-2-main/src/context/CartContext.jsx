// src/context/CartContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

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
  const [carrito, setCarrito] = useState(() => leerAlmacenado(CARRITO_KEY));
  const [favoritos, setFavoritos] = useState(() => leerAlmacenado(FAVORITOS_KEY));
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Persistir carrito y favoritos cada vez que cambian
  useEffect(() => {
    guardarAlmacenado(CARRITO_KEY, carrito);
  }, [carrito]);

  useEffect(() => {
    guardarAlmacenado(FAVORITOS_KEY, favoritos);
  }, [favoritos]);

  // Abrir / cerrar el panel del carrito desde cualquier componente
  const abrirCarrito = () => setIsCartOpen(true);
  const cerrarCarrito = () => setIsCartOpen(false);

  // Agregar producto al carrito, respetando el stock disponible
  const agregarAlCarrito = (producto, cantidad = 1) => {
    setCarrito((prevCarrito) => {
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

  // Restar o eliminar producto
  const eliminarDelCarrito = (id) => {
    setCarrito((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, cantidad: item.cantidad - 1 } : item))
        .filter((item) => item.cantidad > 0)
    );
  };

  // Quitar por completo un producto del carrito (sin importar la cantidad)
  const quitarProductoDelCarrito = (id) => {
    setCarrito((prev) => prev.filter((item) => item.id !== id));
  };

  // Vaciar carrito
  const vaciarCarrito = () => setCarrito([]);

  // --- Favoritos ---
  const estaEnFavoritos = (id) => favoritos.some((item) => item.id === id);

  const alternarFavorito = (producto) => {
    setFavoritos((prev) =>
      prev.some((item) => item.id === producto.id)
        ? prev.filter((item) => item.id !== producto.id)
        : [...prev, producto]
    );
  };

  // Calcular total de ítems
  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  // Calcular precio total (soporta precio numérico o string tipo "$1,199")
  const totalPrecio = carrito.reduce((acc, item) => {
    const precioNum = Number(String(item.precio).replace(/[^0-9.-]+/g, ''));
    return acc + precioNum * item.cantidad;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        carrito,
        agregarAlCarrito,
        eliminarDelCarrito,
        quitarProductoDelCarrito,
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
