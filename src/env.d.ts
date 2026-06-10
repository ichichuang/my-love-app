/// <reference types="vite/client" />

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, never>, unknown>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_WECHAT_APPID?: string
  readonly VITE_CLOUDBASE_ENV_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
