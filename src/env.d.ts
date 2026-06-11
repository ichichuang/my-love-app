/// <reference types="vite/client" />

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, never>, unknown>
  export default component
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
