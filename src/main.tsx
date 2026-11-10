import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeThemeOnStartup } from './services/themeEngine'

// Synchronously apply saved user theme before React tree hydration
initializeThemeOnStartup();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker for offline resilience
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = import.meta.env.BASE_URL.endsWith('/')
      ? `${import.meta.env.BASE_URL}sw.js`
      : `${import.meta.env.BASE_URL}/sw.js`;
    navigator.serviceWorker.register(swUrl).then((reg) => {
      console.log('Om Knowledge OS ServiceWorker registered offline successfully:', reg.scope);
    }).catch((err) => {
      console.log('SW registration error:', err);
    });
  });
}
