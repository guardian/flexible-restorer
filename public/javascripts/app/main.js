import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { App } from './components/App';
import { store } from './components/store/store';

import '../../gu-noting.css';

const rootElement = document.getElementById('app');

if (!rootElement) {
  throw new Error('React app root element was not found.');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);
