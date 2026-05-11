import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { useOfflineQueueFlusher } from './hooks/useOfflineQueue.js'

function Root() {
  useOfflineQueueFlusher()
  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
