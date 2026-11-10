import { TYPES, today, dateParts } from './constants'

export default function SessionCard({ session: s, showAthlete, onDelete }) {
  const { weekday, day, month } = dateParts(s.date)
  const isToday = s.date === today()

  return (
    <li className={`session ${isToday ? 'session--today' : ''}`}>
      <div className="session__date">
        <span>{weekday}</span>
        <strong>{day}</strong>
        <span>{month}</span>
      </div>

      <div className="session__body">
        <div className="session__meta">
          <span className="tag">{TYPES[s.type]}</span>
          {isToday && <span className="tag tag--accent">Aujourd'hui</span>}
          {showAthlete && <span className="muted">{s.athletes?.name}</span>}
        </div>
        <div className="session__title">{s.title}</div>
        {s.details && <p className="session__details">{s.details}</p>}
      </div>

      <div className="session__side">
        {s.distance_km && (
          <div className="session__km">
            <strong>{s.distance_km}</strong>
            <span>km</span>
          </div>
        )}
        {onDelete && (
          <button className="ghost" onClick={() => onDelete(s.id)}>
            Supprimer
          </button>
        )}
      </div>
    </li>
  )
}