import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import WeekView from './WeekView'

export default function AthleteView() {
  const [sessions, setSessions] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.from('sessions').select('*, athletes(paces)').order('date')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setSessions(data)
      })
  }, [])

  return (
    <>
      {error && <p className="error">{error}</p>}
      <WeekView sessions={sessions} />
    </>
  )
}