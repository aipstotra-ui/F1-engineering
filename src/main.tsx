import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './ui/theme.css'
import App from './App.tsx'

const root = document.getElementById('root')
if (!root) throw new Error('index.html is missing the <div id="root"> element')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
