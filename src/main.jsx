import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Self-hosted fonts: no reader request ever leaves the site, which keeps
// the "no third parties" privacy claim literally true. Latin + latin-ext
// covers English and the Spanish/Hmong diacritics a Wausau board may need.
import '@fontsource/oswald/latin-400.css';
import '@fontsource/oswald/latin-500.css';
import '@fontsource/oswald/latin-600.css';
import '@fontsource/oswald/latin-ext-400.css';
import '@fontsource/oswald/latin-ext-500.css';
import '@fontsource/oswald/latin-ext-600.css';
import '@fontsource/merriweather/latin-300.css';
import '@fontsource/merriweather/latin-400.css';
import '@fontsource/merriweather/latin-700.css';
import '@fontsource/merriweather/latin-400-italic.css';
import '@fontsource/merriweather/latin-ext-300.css';
import '@fontsource/merriweather/latin-ext-400.css';
import '@fontsource/merriweather/latin-ext-700.css';
import '@fontsource/merriweather/latin-ext-400-italic.css';
import '@fontsource/courier-prime/latin-400.css';
import '@fontsource/courier-prime/latin-700.css';
import '@fontsource/courier-prime/latin-ext-400.css';
import '@fontsource/courier-prime/latin-ext-700.css';

import './styles/board.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
