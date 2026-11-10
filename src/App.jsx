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
        .from('athletes').select('id').eq('user_id', userId).maybeSingle()
      setRole(data ? 'athlete' : 'coach')
    }
    detectRole()
  }, [userId])

  if (!ready) return <p>Chargement…</p>
  if (!session) return <Login />
  if (!role) return <p>Chargement…</p>

  return (
    <div>
      <p>Connecté : {session.user.email}</p>
      <button onClick={() => supabase.auth.signOut()}>Se déconnecter</button>
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