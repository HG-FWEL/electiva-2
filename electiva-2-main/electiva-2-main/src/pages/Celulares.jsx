// src/pages/Celulares.jsx
import React from 'react';
import CategoryLayout from '../components/CategoryLayout';

function Celulares() {
  return (
    <CategoryLayout
      categoriaSlug="celulares"
      titulo="Smartphones y Celulares"
      badge="LO ÚLTIMO EN TELEFONÍA"
      descripcion="Descubre los mejores dispositivos móviles de Apple, Samsung y Xiaomi con la última tecnología en cámaras y procesadores."
      heroImagen="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80"
      ordenarPorTexto="Recomendados"
    />
  );
}

export default Celulares;
