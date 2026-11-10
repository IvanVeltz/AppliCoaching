import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'

export default function App() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )

    return () => subscription.unsubscribe()
  }, [])

  if (!ready) return <p>Chargement…</p>
  if (!session) return <Login />

  return (
    <div>
      <p>Connecté : {session.user.email}</p>
      <button onClick={() => supabase.auth.signOut()}>Se déconnecter</button>
    </div>
  )
}