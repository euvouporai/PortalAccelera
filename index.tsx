
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Erro: Elemento #root não encontrado.");
} else {
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("React inicializado com sucesso.");
  } catch (error) {
    console.error("Erro fatal na renderização:", error);
    rootElement.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; text-align: center;">
        <h1 style="color: #e11d48;">Erro ao carregar o sistema</h1>
        <p style="color: #64748b;">Houve um conflito de bibliotecas no seu navegador. Tente limpar o cache.</p>
      </div>
    `;
  }
}
