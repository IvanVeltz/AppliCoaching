import { createClient } from '@supabase/supabase-js'

// Vrai si l'utilisateur arrive depuis un lien d'invitation ou de réinitialisation.
// A calculer AVANT createClient, qui efface l'URL après avoir lue.
export const arrivedViaLink = /type=(invite|recovery)/.test(window.location.hash)

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)