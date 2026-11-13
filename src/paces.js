// Les allures possibles : clé stockée en base → nom affiché
export const ZONES = {
  ef: 'EF',
  tempo: 'Tempo', 
  seuil: 'Seuil',
  vma: 'VMA',
  a5: '5 km',
  a10: '10 km',
  a21: 'Semi',
  a42: 'Marathon',
}

// "4:30" → 270 (secondes par km). Renvoie null si le format est invalide.
export function parsePace(text) {
  const m = /^(\d{1,2}):([0-5]\d)$/.exec(text.trim())
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

// 270 → "4:30". Renvoie '' si la valeur est vide.
export function formatPace(sec) {
  if (!sec) return ''
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}

// Calcule la distance (km) et la durée (secondes) d'une séance.
// blocks : liste de blocs ; paces : allures de l'athlète (en secondes par km)
//
// Un bloc ressemble à :
// { reps: 8, zone: 'vma', meters: 400, rest_seconds: 90, rest_zone: 'ef' }
// - reps : nombre de répétitions (1 par défaut)
// - zone : allure de l'effort
// - meters OU seconds : l'effort est défini par une distance ou par une durée
// - rest_seconds / rest_zone : récupération entre les répétitions (rest_zone vide = arrêt ou marche, sans km)
// Calcule la distance (km) et la durée (secondes) d'une séance.
// Un bloc : { role: 'warmup' | 'work' | 'cooldown', zone, reps, meters OU seconds, rest_seconds }
export function computeSession(blocks, paces) {
  let km = 0
  let seconds = 0
  const missing = new Set()   // allures nécessaires mais pas renseignées

  // Distance (k) et durée (s) d'un effort défini en mètres OU en secondes
  function leg(zone, meters, secs) {
    const pace = paces?.[zone]   // secondes par km
    if (meters != null) {
      const k = meters / 1000
      if (!pace) { missing.add(zone); return { k, s: 0 } }   // distance connue, durée inconnue
      return { k, s: k * pace }
    }
    if (!pace) { missing.add(zone); return { k: 0, s: secs } } // durée connue, distance inconnue
    return { k: secs / pace, s: secs }
  }

  // Position du dernier bloc d'effort : pas de récup après sa dernière répétition
  const lastWork = blocks.map((b) => b.role).lastIndexOf('work')

  blocks.forEach((b, i) => {
    const reps = b.reps || 1
    const effort = leg(b.zone, b.meters, b.seconds)
    km += reps * effort.k
    seconds += reps * effort.s

    if (b.role === 'work' && b.rest_seconds) {
      const rests = i === lastWork ? reps - 1 : reps   // nombre de récups à compter
      const rest = leg('ef', null, b.rest_seconds)     // la récup est toujours en EF
      km += rests * rest.k
      seconds += rests * rest.s
    }
  })

  return {
    km: Math.round(km * 10) / 10,   // arrondi à 0,1 km
    seconds: Math.round(seconds),
    missing: [...missing],          // si non vide, le total est partiel
  }
}

// 2802 → "47 min" ; 3900 → "1 h 05"
export function formatDuration(sec) {
  const m = Math.round(sec / 60)
  return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}` : `${m} min`
}

// "400 m" ou "15 min" selon la façon dont le bloc est défini
function amountText(b) {
  return b.meters != null ? `${b.meters} m` : `${b.seconds / 60} min`
}
// 380 → 6'20"/km  (retourne '' si l'allure n'est pas renseignée)
export function formatPaceKm(sec) {
  if (!sec) return ''
  return `${Math.floor(sec / 60)}'${String(sec % 60).padStart(2, '0')}"/km`
}

// Nom de l'allure suivi de sa valeur : VMA (3'30"/km), ou juste VMA si elle n'est pas renseignée
function zoneText(zone, paces) {
  const pace = formatPaceKm(paces?.[zone])
  return pace ? `${ZONES[zone]} (${pace})` : ZONES[zone]
}

// Durée de récup pour l'affichage : 90 → 1'30 ; 120 → 2' ; 45 → 45"
function restText(sec) {
  if (sec < 60) return `${sec}"`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s ? `${m}'${String(s).padStart(2, '0')}` : `${m}'`
}

// Décrit les blocs en une ligne de texte chacun ; paces = allures de l'athlète
export function describeBlocks(blocks, paces) {
  return blocks.map((b) => {
    if (b.role === 'warmup') return `Échauffement ${amountText(b)}`
    if (b.role === 'cooldown') return `Retour au calme ${amountText(b)}`
    const rest = b.rest_seconds
  ? ` · récup ${restText(b.rest_seconds)} EF`
  : ''
    return `${b.reps > 1 ? b.reps + ' × ' : ''}${amountText(b)} ${zoneText(b.zone, paces)}${rest}`
  })
}