export interface ViewerVersion {
  version: string;
  path: string;
}

export interface ViewerAPI {
  init?: (config: any, container: HTMLElement) => void;
  loadConfig?: (config: any) => void;
  destroy?: () => void;
}

declare global {
  interface Window {
    ApexViewer?: ViewerAPI;
    initApexViewer?: (config: any, container: HTMLElement) => void;
  }
}
