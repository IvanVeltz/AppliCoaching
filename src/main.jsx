import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Le point d'entrée de l'application React. 
// On utilise createRoot pour créer un conteneur React dans l'élément HTML avec l'id 'root'.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
