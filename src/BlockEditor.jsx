import { ZONES } from './paces'

// Séance de départ : échauffement et retour au calme déjà là, en EF
export const defaultBlocks = () => [
  { role: 'warmup', zone: 'ef', seconds: 1200 },
  { role: 'cooldown', zone: 'ef', seconds: 600 },
]

// Séance EF simple : un seul bloc d'endurance, défini par sa durée (en minutes)
export const efBlock = (min = 30) => ({
  role: 'work', zone: 'ef', reps: 1, seconds: min * 60, rest_seconds: 0,
})

const newWork = () => ({ role: 'work', reps: 1, zone: 'seuil', meters: 1000, rest_seconds: 0 })

// Champ « quantité + unité » : mètres ou minutes (stockées en secondes)
function Amount({ block, onChange }) {
  const unit = block.meters != null ? 'm' : 'min'
  const value = unit === 'm' ? block.meters : block.seconds / 60

  function set(u, n) {
    onChange(u === 'm'
      ? { ...block, meters: n, seconds: undefined }
      : { ...block, seconds: n * 60, meters: undefined })
  }

  return (
    <>
      <input className="num" type="number" min="0" value={value || ''}
             onChange={(e) => set(unit, Number(e.target.value) || 0)} />
      <select value={unit} onChange={(e) => set(e.target.value, value || 0)}>
        <option value="m">m</option>
        <option value="min">min</option>
      </select>
    </>
  )
}

// blocks : liste complète des blocs ; onChange reçoit la nouvelle liste
export default function BlockEditor({ blocks, onChange }) {
  const warmup = blocks.find((b) => b.role === 'warmup')
  const cooldown = blocks.find((b) => b.role === 'cooldown')
  const work = blocks.filter((b) => b.role === 'work')

  // Reconstruit la liste dans l'ordre : échauffement, efforts, retour au calme
  const emit = (w, wk, c) => onChange([...(w ? [w] : []), ...wk, ...(c ? [c] : [])])
  const updateWork = (i, patch) => emit(warmup, work.map((b, j) => (j === i ? { ...b, ...patch } : b)), cooldown)

  return (
    <div className="blocks">
      {warmup && (
        <div className="block">
          <span className="muted">Échauffement (EF)</span>
          <Amount block={warmup} onChange={(b) => emit(b, work, cooldown)} />
        </div>
      )}

      {work.map((b, i) => (
        <div className="block" key={i}>
          <input className="num" type="number" min="1" value={b.reps || ''} aria-label="Répétitions"
                 onChange={(e) => updateWork(i, { reps: Number(e.target.value) || 1 })} />
          <span>×</span>
          <Amount block={b} onChange={(nb) => updateWork(i, nb)} />
          <select value={b.zone} onChange={(e) => updateWork(i, { zone: e.target.value })}>
            {Object.entries(ZONES).map(([z, label]) => <option key={z} value={z}>{label}</option>)}
          </select>
          <span className="muted">récup</span>
          <input className="num" type="number" min="0" placeholder="0" value={b.rest_seconds || ''}
                 onChange={(e) => updateWork(i, { rest_seconds: Number(e.target.value) || 0 })} />
          <span className="muted">s EF</span>
          {/* type="button" : sans ça, un bouton dans un formulaire l'enverrait */}
          <button type="button" className="ghost"
                  onClick={() => emit(warmup, work.filter((_, j) => j !== i), cooldown)}>✕</button>
        </div>
      ))}

      <button type="button" className="ghost"
              onClick={() => emit(warmup, [...work, newWork()], cooldown)}>
        + Ajouter un bloc
      </button>

      {cooldown && (
        <div className="block">
          <span className="muted">Retour au calme (EF)</span>
          <Amount block={cooldown} onChange={(b) => emit(warmup, work, b)} />
        </div>
      )}
    </div>
  )
}