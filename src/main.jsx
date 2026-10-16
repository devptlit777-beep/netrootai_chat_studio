import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { i18nReady } from './i18n';
import App from './App.jsx';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  i18nReady.then(() => {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }).catch(error => {
    console.error('Unable to load application translations.', error);
    rootElement.textContent = 'Unable to load application translations. Please reload the page.';
  });
}
