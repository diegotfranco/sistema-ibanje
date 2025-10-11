/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_ENV: 'development' | 'production';
  readonly VITE_APP_NAME: string;
  readonly VITE_TIMEOUT?: string; // timeout value in ms
  readonly VITE_DEBUG?: 'true' | 'false';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
