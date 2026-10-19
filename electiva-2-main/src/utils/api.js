// src/utils/api.js
// Único punto de contacto con el backend. Envía el token de sesión en cada
// petición y, si algo falla, lanza un Error con el mensaje que mandó el backend.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const TOKEN_KEY = 'movimarket_token';

// Evento que escucha AuthContext para cerrar la sesión cuando el token vence.
export const EVENTO_SESION_EXPIRADA = 'movimarket:sesion-expirada';

export function leerToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function guardarToken(token) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Sin storage la sesión dura solo mientras la página esté abierta.
  }
}

async function enviar(ruta, opciones) {
  const token = leerToken();
  const headers = { ...opciones.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, { ...opciones, headers });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisa que el backend esté encendido.');
  }

  // Un 401 con token significa que la sesión venció o ya no es válida.
  if (respuesta.status === 401 && token) {
    guardarToken(null);
    window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
  }

  const datos = respuesta.status === 204 ? null : await respuesta.json().catch(() => null);
  if (!respuesta.ok) throw new Error(datos?.error || `El servidor respondió con un error (${respuesta.status})`);
  return datos;
}

export function pedirApi(ruta, { metodo = 'GET', cuerpo } = {}) {
  return enviar(ruta, {
    method: metodo,
    headers: cuerpo ? { 'Content-Type': 'application/json' } : {},
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
}

// Sube una imagen de producto (POST /api/imagenes) y devuelve su URL pública.
export async function subirImagen(archivo) {
  const formulario = new FormData();
  formulario.append('imagen', archivo);
  const { url } = await enviar('/api/imagenes', { method: 'POST', body: formulario });
  return url;
}
