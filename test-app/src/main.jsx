import React from 'react';
import ReactDOM from 'react-dom/client';
import { initialize } from 'unified-error-handling';
import App from './App';

// Initialize error handling before app starts
initialize({
  enableGlobalHandlers: true,
  enableConsoleCapture: true,
  enableNetworkCapture: true,
  maxBreadcrumbs: 50,
  debug: true
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);