// src/pages/Accesorios.jsx
import React from 'react';
import CategoryLayout from '../components/CategoryLayout';

function Accesorios() {
  return (
    <CategoryLayout
      categoriaSlug="accesorios"
      titulo="Accesorios de Computación"
      badge="PERIFÉRICOS & MÁS"
      descripcion="Mejora tu productividad y experiencia de juego con teclados, mouses, monitores y audífonos de alta calidad."
      heroImagen="https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80"
      ordenarPorTexto="Más vendidos"
    />
  );
}

export default Accesorios;
