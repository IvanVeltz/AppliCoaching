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