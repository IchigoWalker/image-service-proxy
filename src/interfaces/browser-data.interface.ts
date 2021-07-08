export interface BrowserVersion {
  major: number;
  minor?: number;
  patch?: number;
}

export interface BrowserData {
  browser: string;
  version: BrowserVersion;
  os?: string;
}
