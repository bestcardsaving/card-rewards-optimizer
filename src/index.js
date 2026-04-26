import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './index.jsx'; // Make sure this matches your filename exactly!

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
