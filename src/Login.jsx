import { useState } from 'react'
import { supabase } from './supabaseClient'

// Le composant Login gère l'authentification de l'utilisateur via Supabase. 
// Il utilise des hooks d'état pour gérer les entrées de l'utilisateur, 
// les erreurs et l'état de chargement. Lorsqu'un utilisateur soumet le formulaire, 
// la fonction handleSubmit est appelée pour tenter de se connecter avec les informations 
// fournies. Si une erreur survient, elle est affichée à l'utilisateur.
export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function forgotPassword() {
    if (!email) return setError("Saisis d'abord ton e-mail.")
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin, // l'e-mail ramène sur l'app
    })
    setError(error ? error.message : 'E-mail envoyé : vérifie ta boîte de réception.')
  }

  return (
    <form className='card login' onSubmit={handleSubmit}>
      <h1>Connexion</h1>
      <input type="email" placeholder="E-mail" value={email}
             onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Mot de passe" value={password}
             onChange={(e) => setPassword(e.target.value)} required />
      <button disabled={loading}>{loading ? '…' : 'Se connecter'}</button>
      <button type="button" className="ghost" onClick={forgotPassword}>
        Mot de passe oublié ?
      </button>
      {error && <p className='error'>{error}</p>}
    </form>
  )
}