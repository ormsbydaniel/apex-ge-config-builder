/**
 * Example Entry Point for Embedded Viewer
 * 
 * This is a template showing how to modify your viewer's main.tsx/index.tsx
 * to work with the config builder's embedding system.
 * 
 * Replace your current auto-rendering entry point with this pattern.
 */

import { createRoot } from 'react-dom/client';
import App from './App'; // Your main App component
import './index.css';

// Type definitions for the global viewer API
declare global {
  interface Window {
    initApexViewer?: (container: HTMLElement) => void;
  }
}

/**
 * Global initialization function
 * Called by the config builder when ready to render the viewer
 */
window.initApexViewer = (container: HTMLElement) => {
  console.log('[ApexViewer] Initializing viewer');
  console.log('[ApexViewer] Container:', container);
  
  // Show loading indicator
  container.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      font-family: system-ui, sans-serif;
      color: #6b7280;
    ">
      <div style="text-align: center;">
        <div style="
          width: 48px;
          height: 48px;
          border: 4px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        "></div>
        <div>Loading configuration...</div>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    </div>
  `;
  
  // Fetch configuration from the config builder
  fetch('/config.json')
    .then(response => {
      console.log('[ApexViewer] Config response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    })
    .then(config => {
      console.log('[ApexViewer] Config loaded successfully');
      console.log('[ApexViewer] Config summary:', {
        version: config.version,
        title: config.meta?.title,
        interfaceGroups: config.interfaceGroups?.length || 0,
        services: config.services?.length || 0,
        sources: config.sources?.length || 0,
      });
      
      // Clear loading state
      container.innerHTML = '';
      
      // Create React root and render the app with the config
      const root = createRoot(container);
      root.render(<App config={config} />);
      
      console.log('[ApexViewer] Viewer rendered successfully');
    })
    .catch(error => {
      console.error('[ApexViewer] Initialization failed:', error);
      
      // Show error message in the container
      container.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 40px;
          font-family: system-ui, sans-serif;
        ">
          <div style="max-width: 600px; text-align: center;">
            <svg 
              style="width: 64px; height: 64px; margin: 0 auto 24px; color: #dc2626;"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            
            <h2 style="
              color: #dc2626;
              font-size: 24px;
              font-weight: 600;
              margin: 0 0 16px 0;
            ">
              Failed to Load Viewer
            </h2>
            
            <p style="
              color: #6b7280;
              font-size: 16px;
              margin: 0 0 24px 0;
              line-height: 1.5;
            ">
              ${error.message || 'An unexpected error occurred'}
            </p>
            
            <details style="text-align: left;">
              <summary style="
                cursor: pointer;
                color: #3b82f6;
                font-weight: 500;
                user-select: none;
              ">
                Technical Details
              </summary>
              <pre style="
                margin-top: 16px;
                padding: 16px;
                background: #f3f4f6;
                border-radius: 8px;
                overflow-x: auto;
                font-size: 13px;
                line-height: 1.5;
                color: #374151;
              ">${error.stack || error.message}</pre>
            </details>
          </div>
        </div>
      `;
    });
};

// Log that the bundle has loaded successfully
console.log('[ApexViewer] ====================================');
console.log('[ApexViewer] Bundle loaded successfully');
console.log('[ApexViewer] Waiting for initialization call...');
console.log('[ApexViewer] Call window.initApexViewer(container)');
console.log('[ApexViewer] ====================================');

// For development: check if we're in standalone mode
if (import.meta.env.DEV) {
  console.log('[ApexViewer] Development mode detected');
  console.log('[ApexViewer] To test embedding, create an HTML file that calls initApexViewer()');
}
