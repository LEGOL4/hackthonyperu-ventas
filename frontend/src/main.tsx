import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// <StrictMode> removido: en React 19 modo desarrollo invoca efectos dos veces,
// lo que puede convertir un fetch único en un loop de re-renders.
createRoot(document.getElementById('root')!).render(
  <App />
);