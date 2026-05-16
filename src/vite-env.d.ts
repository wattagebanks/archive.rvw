/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_R2_UPLOAD_URL: string | undefined;
  readonly VITE_R2_UPLOAD_TOKEN: string | undefined;
  readonly VITE_ADMIN_PASSWORD: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

