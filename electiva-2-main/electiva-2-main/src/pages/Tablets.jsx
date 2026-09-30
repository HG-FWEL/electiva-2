// src/pages/Tablets.jsx
import React from 'react';
import CategoryLayout from '../components/CategoryLayout';

function Tablets() {
  return (
    <CategoryLayout
      categoriaSlug="tablets"
      titulo="Tablets y iPads"
      badge="PORTABILIDAD Y POTENCIA"
      descripcion="Encuentra la tablet ideal para trabajar, estudiar o entretenerte con las mejores marcas del mercado."
      heroImagen="https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80"
      ordenarPorTexto="Recomendados"
    />
  );
}

export default Tablets;
