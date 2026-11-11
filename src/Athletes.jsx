// useEffect() : permet de lancer un code au chargement du composant, ou quand une variable change
// useState() : permet de mémoriser une valeur, et de relancer le rendu quand elle change
import { useEffect, useState } from 'react'
// Le client Supabase est initialisé dans supabaseClient.js
import { supabase } from './supabaseClient'

export default function Athletes() {
  // La liste des athlètes
  const [athletes, setAthletes] = useState([])
  // Les champs du formulaire d'ajout d'athlète
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  // Le message d'erreur à afficher (null = pas d'erreur)
  const [error, setError] = useState(null)

  // Ce bloc tourne une seule fois au chargement du composant pour récupérer la liste des athlètes
  useEffect(() => {
    supabase
      .from('athletes') // la table à interroger
      .select('*') // on veut toutes les colonnes
      .order('name') // on trie par nom
      .then(({ data, error }) => {
        // Si une erreur survient, on l'affiche ; sinon on met à jour la liste des athlètes
        if (error) setError(error.message)
        else setAthletes(data)
      })
  }, [])

  // Cette fonction est appelée quand on soumet le formulaire d'ajout d'athlète
  async function addAthlete(e) {
    e.preventDefault() // empêche le rechargement de la page
    setError(null) // on efface l'erreur précédente
    const { data, error } = await supabase
      .from('athletes')
      // trim() : supprime les espaces au début et à la fin de la chaîne
      .insert({ name: name.trim(), email: email.trim() }) // insère une nouvelle ligne dans la table athletes
      .select() // on veut récupérer la ligne insérée pour l'ajouter à la liste
      .single() // on veut une seule ligne, pas un tableau
    if (error) setError(error.message)
    else {
      // On ajoute le nouvel athlète à la liste, et on vide les champs du formulaire
      setAthletes([...athletes, data])
      setName('')
      setEmail('')
    }
  }

  // Cette fonction est appelée quand on clique sur le bouton "Supprimer" d'un athlète
  async function removeAthlete(id) {
    // On demande confirmation avant de supprimer l'athlète et toutes ses séances
    if (!confirm('Supprimer cet athlète et toutes ses séances ?')) return
    // On supprime l'athlète de la table athletes, et on met à jour la liste des athlètes
    const { error } = await supabase.from('athletes').delete().eq('id', id)
    if (error) setError(error.message)
    // Si la suppression a réussi, on enlève l'athlète de la liste locale pour mettre à jour l'affichage
    else setAthletes(athletes.filter((a) => a.id !== id))
  }

  return (
    <section>
      <h2>Mes athlètes</h2>
      <form className="form-grid" onSubmit={addAthlete}>
        <input
          placeholder="Prénom de l'athlète"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input type="email" placeholder="E-mail de l'athlète" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
        <button className="full">Ajouter</button>
      </form>
      {error && <p className="error">{error}</p>}
      <ul className="list">
        {athletes.map((a) => (
          <li key={a.id} className="card row">
            <div>
            <strong>{a.name}</strong>
            <div className="muted">{a.email}</div>
            </div>
            <button className="ghost" onClick={() => removeAthlete(a.id)}>Supprimer</button>
        </li>
        ))}
      </ul>
      {athletes.length === 0 && <p>Aucun athlète pour l'instant.</p>}
    </section>
  )
}