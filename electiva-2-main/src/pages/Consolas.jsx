// src/pages/Consolas.jsx
import React from 'react';
import CategoryLayout from '../components/CategoryLayout';

function Consolas() {
  return (
    <CategoryLayout
      categoriaSlug="consolas"
      titulo="Consolas de Videojuegos"
      badge="GAMING Y ENTRETENIMIENTO"
      descripcion="Disfruta de la máxima potencia de juego con las consolas de PlayStation, Xbox y Nintendo."
      heroImagen="https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80"
      ordenarPorTexto="Más jugadas"
    />
  );
}

export default Consolas;
