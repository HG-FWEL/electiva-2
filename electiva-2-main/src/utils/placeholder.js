// src/utils/placeholder.js
// Imagen de respaldo (SVG en base64) que se usa cuando la foto de un producto
// no logra cargar, para no dejar el ícono roto del navegador.
export const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect width="400" height="400" fill="#f1f5f9"/>
      <g fill="#94a3b8">
        <rect x="130" y="150" width="140" height="100" rx="10" fill="none" stroke="#94a3b8" stroke-width="6"/>
        <circle cx="165" cy="180" r="12" fill="#94a3b8"/>
        <path d="M130 235 L175 195 L210 220 L240 190 L270 235 Z" fill="#94a3b8"/>
      </g>
      <text x="200" y="290" font-family="Arial, sans-serif" font-size="16" fill="#94a3b8" text-anchor="middle">
        Imagen no disponible
      </text>
    </svg>
  `);

export function handleImgError(e) {
  e.target.onerror = null;
  e.target.src = FALLBACK_IMAGE;
}
