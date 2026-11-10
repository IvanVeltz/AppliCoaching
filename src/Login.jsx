import { useState } from 'react'
import { supabase } from './supabaseClient'

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

  return (
    <form className='card login' onSubmit={handleSubmit}>
      <h1>Connexion</h1>
      <input type="email" placeholder="E-mail" value={email}
             onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Mot de passe" value={password}
             onChange={(e) => setPassword(e.target.value)} required />
      <button disabled={loading}>{loading ? '…' : 'Se connecter'}</button>
      {error && <p className='error'>{error}</p>}
    </form>
  )
}