// src/utils/categorias.js
// Datos de cada categoría calculados a partir del catálogo real del backend,
// para que las vitrinas (Inicio y Productos) nunca muestren cifras inventadas.
import {
  faLaptop,
  faDesktop,
  faDisplay,
  faHeadset,
  faGamepad,
  faTabletScreenButton,
  faMobileScreenButton,
  faClock,
  faHeadphones,
} from '@fortawesome/free-solid-svg-icons';
import { categorias } from '../data/Productos';

export const ICONOS_CATEGORIA = {
  computadores: faLaptop,
  escritorio: faDesktop,
  'all-in-one': faDisplay,
  gaming: faHeadset,
  consolas: faGamepad,
  tablets: faTabletScreenButton,
  celulares: faMobileScreenButton,
  'apple-watch': faClock,
  accesorios: faHeadphones,
};

// [{ slug, nombre, ruta, cantidad, desde, imagen }] en el orden del menú.
export function resumenCategorias(productos) {
  return categorias.map((cat) => {
    const lista = productos.filter((p) => p.categoria === cat.slug);
    return {
      ...cat,
      cantidad: lista.length,
      desde: lista.length > 0 ? Math.min(...lista.map((p) => Number(p.precio))) : null,
      imagen: lista[0]?.imagen ?? null,
    };
  });
}

// Un producto con stock de cada categoría, para mostrar variedad.
export function productosDestacados(productos, maximo = 8) {
  return categorias
    .map((cat) => productos.find((p) => p.categoria === cat.slug && p.stock > 0))
    .filter(Boolean)
    .slice(0, maximo);
}

// Productos a punto de agotarse (1 a 3 unidades), los más escasos primero.
export function ultimasUnidades(productos, maximo = 8) {
  return productos
    .filter((p) => p.stock > 0 && p.stock <= 3)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, maximo);
}
