// Cliente de Supabase del backend. Usa la llave secreta, que salta RLS: por eso
// vive solo aquí y nunca se envía al navegador. Los permisos los decide el
// propio backend (requiereSesion / requiereAdmin).
const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  throw new Error('Faltan SUPABASE_URL y SUPABASE_SECRET_KEY en backend/.env');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

module.exports = supabase;
