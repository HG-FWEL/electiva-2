// src/pages/Computadores.jsx
import React from 'react';
import CategoryLayout from '../components/CategoryLayout';

function Computadores() {
  return (
    <CategoryLayout
      categoriaSlug="computadores"
      titulo="Computadores"
      badge="PRODUCTOS DESTACADOS"
      descripcion="Encuentra las mejores laptops y computadoras de escritorio con el rendimiento que necesitas para trabajar, estudiar y jugar."
      heroImagen="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80"
      ordenarPorTexto="Recomendados"
    />
  );
}

export default Computadores;
