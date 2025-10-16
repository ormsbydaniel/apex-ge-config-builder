import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./utils/queryClient";
import ConfigFetcher from "./ConfigFetcher";
import { createTheme, ThemeProvider } from '@mui/material/styles';

import "../node_modules/spk-components/dist/index.css";
import "./index.css";

const theme = createTheme({
  palette: {
    primary: {
      main: "#008e7a"
    },
    secondary: {
      main: "#008e7a"
    }
  },
});

/**
 * Global viewer initialization function for embedding
 * @param {HTMLElement} container - The container element to render the viewer into
 * @returns {void}
 */
window.initApexViewer = (container) => {
  console.log('[Viewer] initApexViewer called with container:', container);
  
  if (!container) {
    console.error('[Viewer] No container provided to initApexViewer');
    return;
  }

  try {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <ThemeProvider theme={theme}>
          <QueryClientProvider client={queryClient}>
            <ConfigFetcher />
          </QueryClientProvider>
        </ThemeProvider>
      </React.StrictMode>
    );
    console.log('[Viewer] App rendered successfully');
  } catch (error) {
    console.error('[Viewer] Failed to render app:', error);
  }
};

// Log that the bundle is ready
console.log('[Viewer] Bundle loaded successfully. Call window.initApexViewer(container) to initialize.');

// Development mode helper - auto-initialize when running locally
if (import.meta.env.DEV) {
  console.log('[Viewer] Development mode: Auto-initializing for local testing');
  const devContainer = document.getElementById('root');
  if (devContainer) {
    window.initApexViewer(devContainer);
  } else {
    console.warn('[Viewer] Development mode: No #root element found for auto-initialization');
  }
}
