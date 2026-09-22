// src/pages/Escritorio.jsx
import React from 'react';
import CategoryLayout from '../components/CategoryLayout';

function Escritorio() {
  return (
    <CategoryLayout
      categoriaSlug="escritorio"
      titulo="PCs de Escritorio"
      badge="POTENCIA SIN LÍMITES"
      descripcion="Equipos armados y estaciones de trabajo diseñadas para máximo rendimiento en gaming, diseño 3D y multitarea pesada."
      heroImagen="https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80"
      ordenarPorTexto="Mayor rendimiento"
    />
  );
}

export default Escritorio;
