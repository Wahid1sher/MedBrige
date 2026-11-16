import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { CarePlanProvider } from './state/CarePlan';
import './modern.css';
import './responsive.css';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CarePlanProvider>
      <App />
    </CarePlanProvider>
  </StrictMode>,
);
// Only app-shell assets are precached. Never cache patient files or AI responses.
if (
  import.meta.env.PROD &&
  location.protocol !== 'chrome-extension:' &&
  'serviceWorker' in navigator
)
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch(() => {});
  });
import './sky.css';
import './identity.css';
import './complete.css';
import './tour.css';
