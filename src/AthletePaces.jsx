import { useState } from 'react'
import { supabase } from './supabaseClient'
import { ZONES, parsePace, formatPace } from './paces'

export default function AthletePaces({ athlete, onSaved }) {
  // Une valeur texte par allure, préremplie avec celles déjà enregistrées
  const [values, setValues] = useState(() =>
    Object.fromEntries(Object.keys(ZONES).map((z) => [z, formatPace(athlete.paces?.[z])]))
  )
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  async function save(e) {
    e.preventDefault()
    setError(null)
    setSaved(false)

    // On convertit chaque champ "4:30" en secondes, en ignorant les champs vides
    const paces = {}
    for (const zone of Object.keys(ZONES)) {
      const text = values[zone].trim()
      if (!text) continue
      const sec = parsePace(text)
      if (sec === null) return setError(`Allure invalide pour ${ZONES[zone]} (format attendu : 4:30)`)
      paces[zone] = sec
    }

    const { error } = await supabase.from('athletes').update({ paces }).eq('id', athlete.id)
    if (error) setError(error.message)
    else {
      setSaved(true)
      onSaved(athlete.id, paces)   // prévient le parent pour qu'il mette sa liste à jour
    }
  }

  return (
    <form className="form-grid paces" onSubmit={save}>
      {Object.entries(ZONES).map(([zone, label]) => (
        <label key={zone}>
          <span className="muted">{label} (min/km)</span>
          <input
            placeholder="4:30"
            value={values[zone]}
            onChange={(e) => setValues({ ...values, [zone]: e.target.value })}
          />
        </label>
      ))}
      <button className="full">Enregistrer les allures</button>
      {saved && <p className="muted full">Allures enregistrées ✓</p>}
      {error && <p className="error full">{error}</p>}
    </form>
  )
}