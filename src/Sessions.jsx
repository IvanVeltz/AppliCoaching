import { useEffect, useState, useRef } from 'react'
import { supabase } from './supabaseClient'
import { TYPES, today, modeOf } from './constants'
import WeekView from './WeekView'
import BlockEditor, { defaultBlocks, efBlock } from './BlockEditor'
import { computeSession, formatDuration, ZONES } from './paces'

export default function Sessions({ athletes }) {
  const [sessions, setSessions] = useState([])
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    athlete_id: '',
    date: today(),
    type: 'footing',
    distance_km: '',
    title: '',
    details: '',
    blocks: [efBlock()],
  })
  // 'all' = tous les athlètes ; sinon l'id de l'athlète sélectionné
  const [selectedId, setSelectedId] = useState(null)
  const [editingId, setEditingId] = useState(null)   // id de la séance en cours de modification, sinon null
  const formRef = useRef(null)                        // pour faire défiler la page jusqu'au formulaire

  // Chargement des séances, une seule fois
  useEffect(() => {
    loadSessions()
  }, [])

  // Le formulaire pointe toujours sur un athlète existant (le premier au départ,
  // ou le premier de la liste si celui qui était choisi a été supprimé)
  useEffect(() => {
    setForm((f) =>
      athletes.some((a) => a.id === f.athlete_id)
        ? f
        : { ...f, athlete_id: athletes[0]?.id ?? '' }
    )
  }, [athletes])

  async function loadSessions() {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('date', { ascending: false })
    if (error) setError(error.message)
    else setSessions(data)
  }

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  // Formulaire vide, sur l'athlète donné
function blankForm(athleteId) {
  return { athlete_id: athleteId, date: today(), type: 'footing',
           distance_km: '', title: '', details: '', blocks: [efBlock()] }
}

// Charge une séance existante dans le formulaire
function startEdit(s) {
  setEditingId(s.id)
  setForm({
    athlete_id: s.athlete_id,
    date: s.date,
    type: s.type,
    distance_km: s.distance_km ?? '',
    // Un titre automatique ("EF 45 min") est vidé, pour être recalculé si tu changes la durée
    title: /^(EF|Sortie longue) [\d.]+ min$/.test(s.title) ? '' : s.title,
    details: s.details ?? '',
    blocks: s.blocks?.length ? s.blocks : startBlocks(s.type),
  })
  formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function cancelEdit() {
  setEditingId(null)
  setForm(blankForm(form.athlete_id))
}

// Crée une séance, ou enregistre les modifications si on est en train d'en modifier une
async function saveSession(e) {
  e.preventDefault()
  setError(null)
  const row = {
    ...form,
    title: form.title.trim() || (isSimple ? `${autoName} ${minutes} min` : ''),
    distance_km: hasWork ? calc.km : (form.distance_km === '' ? null : Number(form.distance_km)),
    blocks: hasWork ? form.blocks : [],
  }
  if (editingId) {
    // .select('id') permet de savoir si une ligne a vraiment été modifiée :
    // la sécurité de la base refuse parfois sans renvoyer d'erreur
    const { data, error } = await supabase
      .from('sessions').update(row).eq('id', editingId).select('id')
    if (error) return setError(error.message)
    if (!data?.length) return setError('Modification refusée ou séance introuvable.')
    setEditingId(null)
    setForm(blankForm(form.athlete_id))
  } else {
    const { error } = await supabase.from('sessions').insert(row)
    if (error) return setError(error.message)
    setForm({ ...form, title: '', details: '', distance_km: '', blocks: startBlocks(form.type) })
  }
  loadSessions()
}

  async function removeSession(id) {
    if (id === editingId) cancelEdit()
    const { error } = await supabase.from('sessions').delete().eq('id', id)
    if (error) setError(error.message)
    else setSessions(sessions.filter((s) => s.id !== id))
  }

  const athlete = athletes.find((a) => a.id === form.athlete_id)
  const hasWork = form.blocks.some((b) => b.role === 'work')
  const calc = computeSession(form.blocks, athlete?.paces)

  // Mode de saisie du type choisi : 'simple', 'choice' ou 'blocks'
  const mode = modeOf(form.type)
  // Séance 100 % EF : un seul bloc en EF, sans échauffement ni retour au calme
  const singleEf = form.blocks.length === 1 && form.blocks[0].zone === 'ef'
  // On n'affiche que la durée pour un footing, ou pour une sortie longue 100 % EF
  const isSimple = mode === 'simple' || (mode === 'choice' && singleEf)
  const minutes = isSimple ? (form.blocks[0]?.seconds ?? 0) / 60 : 0
  // Début du titre automatique : "EF 45 min" ou "Sortie longue 90 min"
  const autoName = form.type === 'sortie_longue' ? 'Sortie longue' : 'EF'

  // Blocs de départ selon le mode de saisie du type
  function startBlocks(type) {
    const m = modeOf(type)
    if (m === 'simple') return [efBlock()]
    if (m === 'choice') return [efBlock(90)]   // sortie longue : 90 min en EF par défaut
    return defaultBlocks()
  }

  // On ne réinitialise les blocs que si le mode de saisie change, pour ne pas perdre une saisie en cours
  function changeType(e) {
    const type = e.target.value
    setForm({ ...form, type, blocks: modeOf(type) !== mode ? startBlocks(type) : form.blocks })
  }

  // Athlète affiché : celui choisi, ou à défaut le premier (ou « tous » s'il n'y en a aucun)
  const current =
    selectedId === 'all' || athletes.some((a) => a.id === selectedId)
      ? selectedId
      : (athletes[0]?.id ?? 'all')

  // On rattache chaque séance à la version À JOUR de son athlète (nom et allures).
  // Les séances d'un athlète supprimé disparaissent de la liste.
  const withAthlete = sessions
    .map((s) => ({ ...s, athletes: athletes.find((a) => a.id === s.athlete_id) }))
    .filter((s) => s.athletes)

  // Les séances de l'athlète choisi (toutes si « Tous »)
  const visible = current === 'all' ? withAthlete : withAthlete.filter((s) => s.athlete_id === current)

  // Changer d'athlète change aussi celui du formulaire
  function pick(id) {
    setSelectedId(id)
    if (id !== 'all' && !editingId) setForm((f) => ({ ...f, athlete_id: id }))
  }

  return (
    <section>
      <h2>Séances</h2>
      <div className="chips">
        {athletes.map((a) => (
          <button type="button" key={a.id}
                  className={`chip ${current === a.id ? 'chip--on' : ''}`}
                  onClick={() => pick(a.id)}>
            {a.name}
          </button>
        ))}
        <button type="button"
                className={`chip ${current === 'all' ? 'chip--on' : ''}`}
                onClick={() => pick('all')}>
          Tous
        </button>
      </div>

            <form ref={formRef} className="card form-grid" onSubmit={saveSession}>
        {editingId && (
          <p className="full">
            <strong>Modification d'une séance</strong>{' '}
            <span className="muted">— les km seront recalculés avec les allures actuelles.</span>
          </p>
        )}
        <select value={form.athlete_id} onChange={update('athlete_id')} required>
          <option value="">— athlète —</option>
          {athletes.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <input type="date" value={form.date} onChange={update('date')} required />
        <select value={form.type} onChange={changeType}>
          {Object.entries(TYPES).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {!hasWork && (
          <input type="number" step="0.1" min="0" placeholder="km"
                 value={form.distance_km} onChange={update('distance_km')} />
        )}
        <input className="full"
               placeholder={isSimple ? 'Titre (facultatif)' : 'Titre (ex : 8×400 m)'}
               value={form.title} onChange={update('title')} required={!isSimple} />
        <div className="full">
          {mode === 'choice' && (
            <div className="chips">
              {/* Les gardes !isSimple / isSimple évitent de réinitialiser la saisie si on reclique sur le mode actif */}
              <button type="button" className={`chip ${isSimple ? 'chip--on' : ''}`}
                      onClick={() => !isSimple && setForm({ ...form, blocks: [efBlock(90)] })}>
                100 % EF
              </button>
              <button type="button" className={`chip ${!isSimple ? 'chip--on' : ''}`}
                      onClick={() => isSimple && setForm({ ...form, blocks: defaultBlocks() })}>
                Avec blocs d'allure
              </button>
            </div>
          )}
          {isSimple ? (
            // Séance EF : une seule information, la durée
            <label>
              <span className="muted">Durée (min)</span>
              <input type="number" min="1" required
                     value={minutes || ''}
                     onChange={(e) => setForm({ ...form, blocks: [efBlock(Number(e.target.value) || 0)] })} />
            </label>
          ) : (
            <BlockEditor blocks={form.blocks} onChange={(blocks) => setForm({ ...form, blocks })} />
          )}
          {hasWork && athlete && (
            <p className="muted">
              ≈ {calc.km} km · {formatDuration(calc.seconds)}
              {calc.missing.length > 0 &&
                ` — allure manquante : ${calc.missing.map((z) => ZONES[z]).join(', ')} (total partiel)`}
            </p>
          )}
        </div>
        <textarea className="full" placeholder="Détails : échauffement, allure, récup…"
                  value={form.details} onChange={update('details')} />
        <button className="full">{editingId ? 'Enregistrer les modifications' : 'Envoyer la séance'}</button>
        {editingId && (
          <button type="button" className="ghost full" onClick={cancelEdit}>Annuler</button>
        )}
      </form>

      {error && <p className="error">{error}</p>}

      <WeekView sessions={visible} showAthlete={current === 'all'} onDelete={removeSession} onEdit={startEdit} />
    </section>
  )
}