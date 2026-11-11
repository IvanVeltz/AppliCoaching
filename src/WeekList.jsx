import { today, mondayOf, weekLabel, groupByWeek } from './constants'
import SessionCard from './SessionCard'

export default function WeekList({ sessions, newestFirst = false, showAthlete, onDelete }) {
    const thisWeek = mondayOf(today())
    const weeks = groupByWeek(sessions)
    if (newestFirst) weeks.reverse()

    return weeks.map((w) => (
        <section key={w.monday}>
            {/* En-tête de la semaine, par exemple "Semaine du 11 au 17 novembre" */}
            <div className="week__head">
            <h2>{weekLabel(w.monday)}</h2>
            {w.monday === thisWeek && <span className="tag tag--accent">Cette semaine</span>}
            <span className="muted">
            {w.sessions.length} séance{w.sessions.length > 1 ? 's' : ''}
            {w.km > 0 && ` · ${Math.round(w.km * 10) / 10} km`}
            </span>
        </div>
        <ul className="list">
            {w.sessions.map((s) => (
            <SessionCard key={s.id} session={s} showAthlete={showAthlete} onDelete={onDelete} />
            ))}
        </ul>
        </section>
    ))
}