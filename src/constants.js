// Types de séances, pour l'affichage dans la liste déroulante
export const TYPES = {
  footing: 'Endurance Fondamentale',
  fractionne: 'Fractionné',
  seuil: 'Seuil',
  sortie_longue: 'Sortie longue',
  cotes: 'Côtes',
  recuperation: 'Récupération',
  course: 'Course',
}

// Date du jour en heure locale, au format YYYY-MM-DD
export const today = () => new Date().toLocaleDateString('sv-SE')

// Découpe "2026-11-11" en morceaux pour l'affichage (12h évite les décalages de fuseau)
export function dateParts(iso) {
  const d = new Date(iso + 'T12:00')
  return {
    weekday: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
    day: d.getDate(),
    month: d.toLocaleDateString('fr-FR', { month: 'short' }),
  }
}

// Renvoie la date du lundi de la semaain d'une date donnée
export function mondayOf(iso) {
  const d = new Date(iso + 'T12:00') // 12h évite les décalages de fuseau
  const daySinceMonday = (d.getDay() + 6) % 7 // 0=dimanche, 1=lundi, ..., 6=samedi
  d.setDate(d.getDate() - daySinceMonday) // recule jusqu'au lundi
  return d.toLocaleDateString('sv-SE') // renvoie au format YYYY-MM-DD
}

// Texte du titre d'une semaine, ex. "9 nov. → 15 nov."
export function weekLabel(monday) {
  const start = new Date(monday + 'T12:00')   // le lundi
  const end = new Date(monday + 'T12:00')
  end.setDate(end.getDate() + 6)              // +6 jours = le dimanche
  const fmt = { day: 'numeric', month: 'short' }
  return `${start.toLocaleDateString('fr-FR', fmt)} → ${end.toLocaleDateString('fr-FR', fmt)}`
}

// Ranges les seances par semaine, en utilisant le lundi comme clé
export function groupByWeek(sessions) {
  const weeks = {}
  for (const s of sessions) {
    const monday = mondayOf(s.date)
    // Si la semaine n'existe pas encore, on l'initialise
    if (!weeks[monday]) weeks[monday] = { monday, sessions: [] , km: 0 }
    weeks[monday].sessions.push(s)
    weeks[monday].km += Number(s.distance_km) || 0
  }
  return Object.values(weeks)
    .sort((a, b) => a.monday.localeCompare(b.monday))
    .map((w) => ({ 
      ...w, 
      sessions: w.sessions.sort((a, b) => a.date.localeCompare(b.date)) }))
    }

// Ajoute (ou retire, si n est négatif) des jours à une date "AAAA-MM-JJ"
export function addDays(iso, n) {
  const d = new Date(iso + 'T12:00')   // 12h : évite les décalages de fuseau horaire
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('sv-SE')
}