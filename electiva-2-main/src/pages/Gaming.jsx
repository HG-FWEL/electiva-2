// src/pages/Gaming.jsx
import React from 'react';
import CategoryLayout from '../components/CategoryLayout';

function Gaming() {
  return (
    <CategoryLayout
      categoriaSlug="gaming"
      titulo="Zona Gaming Pro"
      badge="MÁXIMO RENDIMIENTO"
      descripcion="Domina tus partidas con las laptops y torres gaming más potentes del mercado. Gráficos RTX de última generación y tasas de refresco ultrafieles."
      heroImagen="https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80"
      ordenarPorTexto="Mayor potencia"
    />
  );
}

export default Gaming;
