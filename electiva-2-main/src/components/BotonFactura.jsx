// src/components/BotonFactura.jsx
// Botón que genera y descarga la factura en PDF de un pedido pagado.
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileArrowDown, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { descargarFactura } from '../utils/factura';
import './BotonFactura.css';

function BotonFactura({ pedido, compacto = false }) {
  const [generando, setGenerando] = useState(false);

  const handleClick = async () => {
    setGenerando(true);
    try {
      await descargarFactura(pedido);
    } catch (error) {
      console.error(error);
      window.alert('No se pudo generar la factura. Inténtalo de nuevo.');
    } finally {
      setGenerando(false);
    }
  };

  return (
    <button
      type="button"
      className={`btn-factura ${compacto ? 'btn-factura-compacto' : ''}`}
      onClick={handleClick}
      disabled={generando}
      title={`Descargar la factura del pedido ${pedido.referencia}`}
    >
      <FontAwesomeIcon icon={generando ? faSpinner : faFileArrowDown} spin={generando} />
      {generando ? 'Generando…' : 'Descargar factura'}
    </button>
  );
}

export default BotonFactura;
