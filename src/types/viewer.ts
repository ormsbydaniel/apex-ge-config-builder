export interface ViewerVersion {
  version: string;
  path: string;
}

export interface ViewerAPI {
  init?: (container: HTMLElement) => void;
  destroy?: () => void;
}

declare global {
  interface Window {
    ApexViewer?: ViewerAPI;
    initApexViewer?: (container: HTMLElement, options?: { config?: any }) => void;
  }
}
