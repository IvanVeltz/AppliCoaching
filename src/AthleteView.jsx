import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { TYPES, today } from './constants'

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

  const card = (s) => (
    <li key={s.id}>
      <strong>{s.date}</strong> · {TYPES[s.type]}
      {s.distance_km && ` · ${s.distance_km} km`}
      <br />
      {s.title}
      {s.details && <div style={{ whiteSpace: 'pre-wrap' }}>{s.details}</div>}
    </li>
  )

  return (
    <section>
      <h2>À venir</h2>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <ul>{upcoming.map(card)}</ul>
      {upcoming.length === 0 && <p>Rien de prévu.</p>}
      <h2>Historique</h2>
      <ul>{past.map(card)}</ul>
    </section>
  )
}