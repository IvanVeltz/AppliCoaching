import { TYPES, today, dateParts } from './constants'
import { describeBlocks } from './paces'

export default function SessionCard({ session: s, showAthlete, onDelete, onEdit }) {
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
        {s.blocks?.length > 0 && (
          <ul className="session__blocks">
            {describeBlocks(s.blocks, s.athletes?.paces).map((line, i) => <li key={i}>{line}</li>)}
          </ul>
        )}
      </div>

      {s.distance_km > 0 && (
        <div className="session__km">
          <strong>{s.distance_km}</strong>
          <span>km</span>
        </div>
      )}

      {/* La description sort de la colonne du milieu : elle occupe toute la largeur */}
      {s.details && <p className="session__details">{s.details}</p>}

      {(onEdit || onDelete) && (
        <div className="session__actions">
          {onEdit && <button className="ghost" onClick={() => onEdit(s)}>Modifier</button>}
          {onDelete && <button className="ghost" onClick={() => onDelete(s.id)}>Supprimer</button>}
        </div>
      )}
    </li>
  )
}