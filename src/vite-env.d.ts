/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TMDB_API_KEY?: string;
  readonly VITE_TMDB_REGION?: string;
  readonly VITE_SEER_API_HOST?: string;
  readonly VITE_SEER_CHAIN_ID?: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
