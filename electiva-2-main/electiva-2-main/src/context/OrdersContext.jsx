// src/context/OrdersContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const OrdersContext = createContext();

const PEDIDOS_KEY = 'movimarket_pedidos';

export const ESTADOS_PEDIDO = {
  revision: 'En revisión',
  enviado: 'Enviado',
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

export function OrdersProvider({ children }) {
  const [pedidos, setPedidos] = useState(() => leerAlmacenado(PEDIDOS_KEY, []));

  useEffect(() => {
    guardarAlmacenado(PEDIDOS_KEY, pedidos);
  }, [pedidos]);

  // Todo pedido nuevo entra "en revisión" hasta que el admin lo despacha.
  const registrarPedido = (pedido) => {
    const nuevoPedido = {
      ...pedido,
      fecha: new Date().toISOString(),
      estado: 'revision',
      fechaEnvio: null,
    };
    setPedidos((prev) => [nuevoPedido, ...prev]);
    return nuevoPedido;
  };

  const cambiarEstadoPedido = (numero, estado) => {
    setPedidos((prev) =>
      prev.map((p) =>
        p.numero === numero
          ? { ...p, estado, fechaEnvio: estado === 'enviado' ? new Date().toISOString() : null }
          : p
      )
    );
  };

  return (
    <OrdersContext.Provider value={{ pedidos, registrarPedido, cambiarEstadoPedido }}>
      {children}
    </OrdersContext.Provider>
  );
}

export const useOrders = () => useContext(OrdersContext);
