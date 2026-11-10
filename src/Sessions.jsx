import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { TYPES, today } from './constants'

export default function Sessions() {
  const [athletes, setAthletes] = useState([])
  const [sessions, setSessions] = useState([])
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    athlete_id: '',
    date: today(),
    type: 'footing',
    distance_km: '',
    title: '',
    details: '',
  })

  useEffect(() => {
    supabase.from('athletes').select('id, name').order('name')
      .then(({ data }) => setAthletes(data ?? []))
    loadSessions()
  }, [])

  async function loadSessions() {
    const { data, error } = await supabase
      .from('sessions')
      .select('*, athletes(name)')
      .order('date', { ascending: false })
    if (error) setError(error.message)
    else setSessions(data)
  }

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  async function addSession(e) {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.from('sessions').insert({
      ...form,
      distance_km: form.distance_km === '' ? null : Number(form.distance_km),
    })
    if (error) return setError(error.message)
    setForm({ ...form, title: '', details: '', distance_km: '' })
    loadSessions()
  }

  async function removeSession(id) {
    const { error } = await supabase.from('sessions').delete().eq('id', id)
    if (error) setError(error.message)
    else setSessions(sessions.filter((s) => s.id !== id))
  }

  return (
    <section>
      <h2>Séances</h2>
      <form className="card form-grid" onSubmit={addSession}>
        <select value={form.athlete_id} onChange={update('athlete_id')} required>
          <option value="">— athlète —</option>
          {athletes.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <input type="date" value={form.date} onChange={update('date')} required />
        <select value={form.type} onChange={update('type')}>
          {Object.entries(TYPES).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <input type="number" step="0.1" min="0" placeholder="km"
               value={form.distance_km} onChange={update('distance_km')} />
        <input placeholder="Titre (ex : 8×400 m)"
               value={form.title} onChange={update('title')} required />
        <textarea placeholder="Détails : échauffement, allure, récup…"
                  value={form.details} onChange={update('details')} />
        <button className="full">Envoyer la séance</button>
      </form>

      {error && <p className="error">{error}</p>}

      <ul className="list">
        {sessions.map((s) => (
          <li key={s.id}>
            <strong>{s.date}</strong> · {s.athletes?.name} · {TYPES[s.type]}
            {s.distance_km && ` · ${s.distance_km} km`}
            <br />
            {s.title}
            {s.details && <div style={{ whiteSpace: 'pre-wrap' }}>{s.details}</div>}
            <button onClick={() => removeSession(s.id)}>Supprimer</button>
          </li>
        ))}
      </ul>
    </section>
  )
}