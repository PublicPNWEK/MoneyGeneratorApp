import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// PWA Service Worker Registration is temporarily disabled
// to fix Netlify deployment issues.

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('[MoneyGeneratorApp] Root DOM element #root not found. Check index.html.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
