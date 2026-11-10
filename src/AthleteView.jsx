import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { today } from './constants'
import SessionCard from './SessionCard'

export default function AthleteView() {
  const [sessions, setSessions] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.from('sessions').select('*').order('date')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setSessions(data)
      })
  }, [])

  const upcoming = sessions.filter((s) => s.date >= today())
  const past = sessions.filter((s) => s.date < today()).reverse()

  return (
    <>
      {error && <p className="error">{error}</p>}

      <h2>À venir</h2>
      <ul className="list">
        {upcoming.map((s) => <SessionCard key={s.id} session={s} />)}
      </ul>
      {upcoming.length === 0 && <p className="muted">Rien de prévu.</p>}

      <h2>Historique</h2>
      <ul className="list list--past">
        {past.map((s) => <SessionCard key={s.id} session={s} />)}
      </ul>
    </>
  )
}