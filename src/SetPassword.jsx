import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function SetPassword({ onDone }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    // L'utilisateur est déjà connecté grâce au lien : on met simplement à jour son mot de passe
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      onDone() // on repasse à l'application normale
    }
  }

  return (
    <form className="card login" onSubmit={handleSubmit}>
      <h1>Choisis ton mot de passe</h1>
      <input type="password" placeholder="Nouveau mot de passe (8 caractères min.)"
             minLength={8} value={password}
             onChange={(e) => setPassword(e.target.value)} required />
      <button disabled={loading}>{loading ? '…' : 'Enregistrer'}</button>
      {error && <p className="error">{error}</p>}
    </form>
  )
}