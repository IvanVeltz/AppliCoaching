import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function Athletes() {
  const [athletes, setAthletes] = useState([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')   
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase
      .from('athletes')
      .select('*')
      .order('name')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setAthletes(data)
      })
  }, [])

  async function addAthlete(e) {
    e.preventDefault()
    setError(null)
    const { data, error } = await supabase
      .from('athletes')
      .insert({ name: name.trim(), email: email.trim() })
      .select()
      .single()
    if (error) setError(error.message)
    else {
      setAthletes([...athletes, data])
      setName('')
      setEmail('')
    }
  }

  async function removeAthlete(id) {
    if (!confirm('Supprimer cet athlète et toutes ses séances ?')) return
    const { error } = await supabase.from('athletes').delete().eq('id', id)
    if (error) setError(error.message)
    else setAthletes(athletes.filter((a) => a.id !== id))
  }

  return (
    <section>
      <h2>Mes athlètes</h2>
      <form onSubmit={addAthlete}>
        <input
          placeholder="Prénom de l'athlète"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input type="email" placeholder="E-mail de l'athlète" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
        <button>Ajouter</button>
      </form>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <ul>
        {athletes.map((a) => (
          <li key={a.id}>
            {a.name}{' '}{a.email}
            <button onClick={() => removeAthlete(a.id)}>Supprimer</button>
          </li>
        ))}
      </ul>
      {athletes.length === 0 && <p>Aucun athlète pour l'instant.</p>}
    </section>
  )
}