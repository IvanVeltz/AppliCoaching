import { useState } from 'react'
import { today, mondayOf, weekLabel, addDays } from './constants'
import SessionCard from './SessionCard'

// Affiche UNE semaine à la fois, avec des boutons pour changer de semaine
export default function WeekView({ sessions, showAthlete, onDelete, onEdit }) {
  // Le lundi de la semaine affichée ; au départ, la semaine en cours
  const thisWeek = mondayOf(today())
  const [monday, setMonday] = useState(thisWeek)

  // On garde seulement les séances de cette semaine, rangées par date
  const weekSessions = sessions
    .filter((s) => mondayOf(s.date) === monday)
    .sort((a, b) => a.date.localeCompare(b.date))

  // Total de km de la semaine (0 si la distance est vide)
  const km = weekSessions.reduce((sum, s) => sum + (Number(s.distance_km) || 0), 0)

  return (
    <section>
      {/* Navigation : semaine précédente, titre, semaine suivante */}
      <div className="weeknav">
        <button className="ghost" aria-label="Semaine précédente"
                onClick={() => setMonday(addDays(monday, -7))}>‹</button>
        <div className="weeknav__title">
          <strong>{weekLabel(monday)}</strong>
          <span className="muted">
            {weekSessions.length} séance{weekSessions.length > 1 ? 's' : ''}
            {km > 0 && ` · ${Math.round(km * 10) / 10} km`}
          </span>
        </div>
        <button className="ghost" aria-label="Semaine suivante"
                onClick={() => setMonday(addDays(monday, 7))}>›</button>
      </div>

      {/* Bouton de retour rapide, affiché seulement si on est ailleurs que sur la semaine en cours */}
      {monday !== thisWeek && (
        <button className="ghost weeknav__today" onClick={() => setMonday(thisWeek)}>
          Revenir à cette semaine
        </button>
      )}

      <ul className="list">
        {weekSessions.map((s) => (
          <SessionCard key={s.id} session={s} showAthlete={showAthlete} onDelete={onDelete} onEdit={onEdit} />
        ))}
      </ul>
      {weekSessions.length === 0 && <p className="muted">Aucune séance cette semaine.</p>}
    </section>
  )
}

