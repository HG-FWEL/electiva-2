// src/pages/Apple watch.jsx
import React from 'react';
import CategoryLayout from '../components/CategoryLayout';

function AppleWatch() {
  return (
    <CategoryLayout
      categoriaSlug="apple-watch"
      titulo="Apple Watch"
      badge="TECNOLOGÍA EN TU MUÑECA"
      descripcion="El dispositivo ideal para monitorear tu salud, entrenamientos y mantenerte conectado en todo momento."
      heroImagen="https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80"
      ordenarPorTexto="Recomendados"
    />
  );
}

export default AppleWatch;
