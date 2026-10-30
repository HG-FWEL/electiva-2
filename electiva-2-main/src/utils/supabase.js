// src/utils/supabase.js
// Cliente de Supabase compartido por toda la app. Usa la llave publicable,
// que es segura en el navegador: el acceso real lo controlan las políticas RLS.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
