console.log('🎵 HarmonyForge: main.tsx script started');

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

// Verify root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  const errorMsg = 'Root element not found! Make sure index.html has a <div id="root"></div>';
  console.error('❌', errorMsg);
  document.body.innerHTML = `<div style="padding: 20px; color: red; font-family: monospace;">${errorMsg}</div>`;
  throw new Error(errorMsg);
}

console.log('✅ Root element found');
console.log('🎵 HarmonyForge: Initializing React app...');

try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  console.log('✅ HarmonyForge: React app mounted successfully');
} catch (error) {
  console.error('❌ HarmonyForge: Failed to mount React app:', error);
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif; background: #fff; color: #000;">
      <h1 style="color: red;">Error Loading HarmonyForge</h1>
      <p><strong>Render Error:</strong> There was an error rendering the application.</p>
      <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto; white-space: pre-wrap; max-height: 400px;">${error instanceof Error ? error.stack : String(error)}</pre>
      <p>Please check the browser console (F12) for more details.</p>
      <p><small>Error type: ${error?.constructor?.name || 'Unknown'}</small></p>
    </div>
  `;
}
