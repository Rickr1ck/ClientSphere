import { createRoot } from 'react-dom/client'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'
import App from './App'

// Global error tracking for troubleshooting white screen
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global Error:', { message, source, lineno, colno, error });
};

window.onunhandledrejection = (event) => {
  console.error('Unhandled Rejection:', event.reason);
};

console.log('Main.tsx: Initializing React app...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Main.tsx: Root element not found!');
} else {
  console.log('Main.tsx: Root element found, rendering...');
  
  try {
    createRoot(rootElement).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>,
    )
    console.log('Main.tsx: Render call completed');
    
    // Removal of initial-loading is now handled inside App.tsx via useEffect
    // to ensure the React app has actually started before hiding the message.
  } catch (error) {
    console.error('Main.tsx: Render failed:', error);
    const initialLoading = document.getElementById('initial-loading');
    if (initialLoading) {
      initialLoading.innerHTML = `
        <div style="color: #ef4444; text-align: center; padding: 20px;">
          <h2 style="margin-bottom: 10px;">Failed to initialize application</h2>
          <pre style="font-size: 12px; white-space: pre-wrap; word-break: break-all;">${error instanceof Error ? error.stack : String(error)}</pre>
        </div>
      `;
    }
  }
}