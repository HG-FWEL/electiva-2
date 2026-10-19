// src/hooks/usePedidos.js
// Pedidos pagados (aprobados o pendientes en Wompi), leídos del backend.
// Solo lo usa el panel de admin, así que se cargan al abrirlo y no en toda la tienda.
import { useState, useEffect, useCallback } from 'react';
import { pedirApi } from '../utils/api';

export const ESTADOS_ENVIO = {
  revision: 'En revisión',
  enviado: 'Enviado',
};

export function usePedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const recargarPedidos = useCallback(async () => {
    try {
      setPedidos(await pedirApi('/api/pedidos?estadoPago=aprobado,pendiente'));
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargarPedidos();
  }, [recargarPedidos]);

  const actualizarPedido = (actualizado) =>
    setPedidos((prev) => prev.map((p) => (p.referencia === actualizado.referencia ? actualizado : p)));

  const cambiarEstadoEnvio = async (referencia, estado) => {
    actualizarPedido(
      await pedirApi(`/api/pedidos/${encodeURIComponent(referencia)}/envio`, { metodo: 'PATCH', cuerpo: { estado } })
    );
  };

  // Vuelve a preguntarle a Wompi por un pago que quedó pendiente.
  const verificarPago = async (pedido) => {
    actualizarPedido(
      await pedirApi(`/api/pedidos/${encodeURIComponent(pedido.referencia)}/confirmar`, {
        metodo: 'POST',
        cuerpo: { transaccionId: pedido.pago.transaccionId },
      })
    );
  };

  return { pedidos, cargando, error, recargarPedidos, cambiarEstadoEnvio, verificarPago };
}
