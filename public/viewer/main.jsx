import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./utils/queryClient";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

import "../node_modules/spk-components/dist/index.css";
import "./index.css";

const theme = createTheme({
  palette: {
    primary: {
      main: "#008e7a",
    },
    secondary: {
      main: "#008e7a",
    },
  },
});

const router = createRouter({
  routeTree,
  context: { queryClient },
  scrollRestoration: true,
  defaultPreload: "intent",
});

/**
 * Listen for config updates from parent window (config builder embedding).
 * When embedded in an iframe, the config builder sends config via postMessage.
 */
window.addEventListener('message', (event) => {
  if (event.data?.type === 'apex-viewer-config') {
    console.log('[Viewer] Received config via postMessage:', event.data.config);
    // Store config globally for the viewer to pick up
    window.__APEX_VIEWER_CONFIG__ = event.data.config;
    // Dispatch a custom event so components can react to config updates
    window.dispatchEvent(new CustomEvent('apex-config-update', { detail: event.data.config }));
  }
});

// Notify parent that the viewer is ready to receive config
if (window.parent !== window) {
  window.parent.postMessage({ type: 'apex-viewer-ready' }, '*');
  console.log('[Viewer] Posted ready message to parent');
}

const rootElement = document.getElementById("root");
if (rootElement && !rootElement.innerHTML) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </ThemeProvider>
    </React.StrictMode>,
  );
}
