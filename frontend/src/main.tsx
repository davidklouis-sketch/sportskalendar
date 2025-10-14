/**
 * SPORTSKALENDAR - ENTRY POINT
 * 
 * React Application Entry Point.
 * Initialisiert die React-App und mountet sie im DOM.
 * 
 * Features:
 * - StrictMode für zusätzliche Entwicklungs-Checks
 * - Tailwind CSS für Styling
 * - Root-Element Mounting
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'; // Tailwind CSS + Custom Styles
import App from './App.tsx';

// Chrome Extension Error Handler - Suppress runtime.lastError warnings
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('runtime.lastError')) {
    event.preventDefault();
    return false;
  }
});

// React App im DOM mounten
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
