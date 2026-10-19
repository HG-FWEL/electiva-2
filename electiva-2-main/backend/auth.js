// Autenticación: contraseñas con bcrypt, sesiones con JWT y middlewares de acceso.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { leerUsuarios, guardarUsuarios } = require('./almacen');

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
const compararPassword = (password, hash) => bcrypt.compare(password, hash);

// Crea la cuenta de administrador definida en .env si todavía no existe.
async function asegurarAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn('Aviso: sin ADMIN_EMAIL/ADMIN_PASSWORD en .env no se crea la cuenta de administrador.');
    return;
  }
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const usuarios = leerUsuarios();
  if (usuarios.some((u) => u.email === email)) return;

  usuarios.push({
    id: 'user-admin',
    nombre: 'Administrador MóvilMarket',
    email,
    passwordHash: await cifrarPassword(ADMIN_PASSWORD),
    rol: 'admin',
    creado: new Date().toISOString(),
  });
  guardarUsuarios(usuarios);
  console.log(`Cuenta de administrador creada: ${email}`);
}

// Lee el token "Authorization: Bearer ..." y deja el usuario en req.usuario.
function requiereSesion(req, res, next) {
  const [tipo, token] = (req.get('Authorization') || '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  let datos;
  try {
    datos = jwt.verify(token, secreto());
  } catch {
    return res.status(401).json({ error: 'Tu sesión expiró o no es válida. Inicia sesión de nuevo.' });
  }
  // Se busca el usuario en cada petición: si lo borran, su token deja de servir.
  const usuario = leerUsuarios().find((u) => u.id === datos.sub);
  if (!usuario) return res.status(401).json({ error: 'La cuenta de esta sesión ya no existe' });
  req.usuario = usuarioPublico(usuario);
  next();
}

function requiereAdmin(req, res, next) {
  requiereSesion(req, res, () => {
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
  requiereAdmin,
};
