import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './index.jsx'; // Ensure this matches src/index.jsx exactly

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
