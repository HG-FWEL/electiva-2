// Autenticación: contraseñas con bcrypt, sesiones con JWT y middlewares de acceso.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { buscarUsuarioPorEmail, buscarUsuarioPorId, crearUsuario } = require('./almacen');

const DURACION_TOKEN = '8h';
const RONDAS_BCRYPT = 10;

function secreto() {
  const valor = process.env.JWT_SECRET;
  if (!valor || valor.length < 32) {
    throw new Error('Falta JWT_SECRET en backend/.env (mínimo 32 caracteres)');
  }
  return valor;
}

// Lo que se puede mostrar de un usuario (nunca el hash de la contraseña).
function usuarioPublico({ id, nombre, email, rol }) {
  return { id, nombre, email, rol };
}

function crearToken(usuario) {
  return jwt.sign({ rol: usuario.rol }, secreto(), { subject: usuario.id, expiresIn: DURACION_TOKEN });
}

const cifrarPassword = (password) => bcrypt.hash(password, RONDAS_BCRYPT);
// Un hash que no es de bcrypt (p. ej. cargado a mano en Supabase) no coincide nunca.
const compararPassword = (password, hash) => bcrypt.compare(password, hash).catch(() => false);

// Crea la cuenta de administrador definida en .env si todavía no existe.
async function asegurarAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn('Aviso: sin ADMIN_EMAIL/ADMIN_PASSWORD en .env no se crea la cuenta de administrador.');
    return;
  }
  const email = ADMIN_EMAIL.trim().toLowerCase();
  if (await buscarUsuarioPorEmail(email)) return;

  await crearUsuario({
    nombre: 'Administrador MóvilMarket',
    email,
    passwordHash: await cifrarPassword(ADMIN_PASSWORD),
    rol: 'admin',
  });
  console.log(`Cuenta de administrador creada: ${email}`);
}

// Devuelve el usuario del token "Authorization: Bearer ...", o un error
// { status, mensaje } si no hay sesión válida.
async function leerSesion(req) {
  const [tipo, token] = (req.get('Authorization') || '').split(' ');
  if (tipo !== 'Bearer' || !token) return { status: 401, mensaje: 'Debes iniciar sesión' };
  let datos;
  try {
    datos = jwt.verify(token, secreto());
  } catch {
    return { status: 401, mensaje: 'Tu sesión expiró o no es válida. Inicia sesión de nuevo.' };
  }
  // Se busca el usuario en cada petición: si lo borran o desactivan, su token deja de servir.
  const usuario = await buscarUsuarioPorId(datos.sub);
  if (!usuario || !usuario.activo) return { status: 401, mensaje: 'La cuenta de esta sesión ya no existe' };
  return { usuario: usuarioPublico(usuario) };
}

// Exige sesión y deja el usuario en req.usuario.
async function requiereSesion(req, res, next) {
  const { usuario, status, mensaje } = await leerSesion(req);
  if (!usuario) return res.status(status).json({ error: mensaje });
  req.usuario = usuario;
  next();
}

// Si hay sesión deja el usuario en req.usuario; si no, sigue como invitado.
async function sesionOpcional(req, res, next) {
  const { usuario } = await leerSesion(req);
  req.usuario = usuario ?? null;
  next();
}

function requiereAdmin(req, res, next) {
  return requiereSesion(req, res, () => {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'Necesitas permisos de administrador' });
    }
    next();
  });
}

module.exports = {
  usuarioPublico,
  crearToken,
  cifrarPassword,
  compararPassword,
  asegurarAdmin,
  requiereSesion,
  sesionOpcional,
  requiereAdmin,
};
