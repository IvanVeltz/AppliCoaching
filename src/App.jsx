// useEffect : exécute du code à certains moments (au chargement, quand une valeur change)
// useState : mémorise une valeur ; quand elle change, l'écran se met à jour
import { useEffect, useState } from 'react'
// Les composants de l'application
import Login from './Login'
import Athletes from './Athletes'
import Sessions from './Sessions'
import AthleteView from './AthleteView'
import { supabase, arrivedViaLink } from './supabaseClient'
import SetPassword from './SetPassword'

export default function App() {
  // Les sessions de connexion : null = pas encore chargé, false = pas connecté, true = connecté
  const [session, setSession] = useState(null)
  // ready = true quand on a fini de charger la session
  const [ready, setReady] = useState(false)
  // role = 'coach' ou 'athlete' selon le rôle de l'utilisateur connecté
  const [role, setRole] = useState(null)
  // displayName = nom de l'athlète connecté (null si c'est un coach)
  const [displayName, setDisplayName] = useState(null)   // avec les autres états
  // true si on arrive depuis un lien d'invitation ou de réinitialisation
  const [choosingPassword, setChoosingPassword] = useState(arrivedViaLink)

  // Ce bloc tourne une seule fois au chargement de l'application pour récupérer la session de connexion
  useEffect(() => {
    
    // On regarde si l'utilisateur est déjà connecté (session en cache)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true) // La verification de la session est terminée, on peut afficher l'application
    })
    // On écoute les changements : connexion, déconnexion, renouvellement du jeton.
    // À chaque changement, on met à jour la session, donc l'écran suit tout seul.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {setSession(session)
      if (_event === 'PASSWORD_RECOVERY') setChoosingPassword(true) // si on arrive depuis un lien de réinitialisation, on affiche le formulaire de choix de mot de passe
    }
  )
    // Nettoyage : quand le composant disparaît, on arrête d'écouter
    return () => subscription.unsubscribe()
  }, [])

  // L'identifiant de l'utilisateur (le ?. évite une erreur si session vaut null)
  const userId = session?.user?.id

  // Ce bloc tourne au chargement, puis chaque fois que userId change
  useEffect(() => {
    // Personne de connecté : on remet le rôle à zéro et on s'arrête là
    if (!userId) {
      setRole(null)
      setDisplayName(null)
      return
    }
    async function detectRole() {
      // Relie le compte à la fiche athlète qui a le meme mail
      await supabase.rpc('claim_athlete')
      // Cherche une fiche athlète lié à ce compte.
      // maybeSingle() : renvoi la ligne si elle existe, sinon null (au lieu d'une erreur)
      const { data } = await supabase
        .from('athletes').select('id, name').eq('user_id', userId).maybeSingle()
      // Une fiche trouvée = c'est un athlète, sinon c'est un coach
      setRole(data ? 'athlete' : 'coach')
      // On garde le nom de l'athlète pour l'afficher dans l'interface
      setDisplayName(data?.name ?? null)
    }
    detectRole()
  }, [userId])

  // Dans l'ordre : on attend que la session soit chargée,
  if (!ready) return <p>Chargement…</p>
  // puis on attend que l'utilisateur se connecte,
  if (!session) return <div className="container"><Login /></div>
  // puis on attend que l'utilisateur choisisse son mot de passe si nécessaire
  if (choosingPassword) return <div className="container"><SetPassword onDone={() => setChoosingPassword(false)} /></div>
  // puis on attend que le rôle soit déterminé.
  if (!role) return <p>Chargement…</p>

  // Ici on est connecté et on connaît le rôle : on affiche l'application
  return (
    <div className="container">
      {/* Barre du haut : titre et bouton de déconnexion */}
      <header className="topbar">
        <h1>🏃 Coach Running</h1>
        <button className="ghost" onClick={() => supabase.auth.signOut()}>
          Déconnexion
        </button>
      </header>
      {/* ?? prend la première valeur disponible, dans cet ordre :
          nom de la fiche athlète, sinon nom des métadonnées du compte, sinon l'e-mail */}
      <p className="muted">
        {displayName ?? session.user.user_metadata?.name ?? session.user.email}
      </p>
      {/* Le coach voit la gestion des athlètes et des séances ; l'athlète voit les siennes */}
      {role === 'coach' ? (
        <>
          <Athletes />
          <Sessions />
        </>
      ) : (
        <AthleteView />
      )}
    </div>
  )
}