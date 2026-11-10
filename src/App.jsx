import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'
import Athletes from './Athletes'
import Sessions from './Sessions'
import AthleteView from './AthleteView'

export default function App() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)
  const [role, setRole] = useState(null)
  const [displayName, setDisplayName] = useState(null)   // avec les autres états

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

  const userId = session?.user?.id

  useEffect(() => {
    if (!userId) return setRole(null)
    async function detectRole() {
      await supabase.rpc('claim_athlete')
      const { data } = await supabase
        .from('athletes').select('id, name').eq('user_id', userId).maybeSingle()
      setRole(data ? 'athlete' : 'coach')
      setDisplayName(data?.name ?? null)
    }
    detectRole()
  }, [userId])

  if (!ready) return <p>Chargement…</p>
  if (!session) return <div className="container"><Login /></div>
  if (!role) return <p>Chargement…</p>

  return (
    <div className="container">
      <header className="topbar">
        <h1>🏃 Coach Running</h1>
        <button className="ghost" onClick={() => supabase.auth.signOut()}>
          Déconnexion
        </button>
      </header>
      <p className="muted">
        {displayName ?? session.user.user_metadata?.name ?? session.user.email}
      </p>
      {role === 'coach' ? (
        <>
          <Athletes />
          <Sessions />
        </>
      ) : (
        <AthleteView />
      )}
    </div>
  )
}