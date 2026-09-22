// src/pages/AllInOne.jsx
import React from 'react';
import CategoryLayout from '../components/CategoryLayout';

function AllInOne() {
  return (
    <CategoryLayout
      categoriaSlug="all-in-one"
      titulo="Computadores All-in-One"
      badge="TODO EN UNO"
      descripcion="Diseño minimalista y alta potencia en una sola pantalla. Libera espacio en tu escritorio con la mejor tecnología integrada."
      heroImagen="https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80"
      ordenarPorTexto="Recomendados"
    />
  );
}

export default AllInOne;
