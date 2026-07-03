/// <reference types="vite/client" />

import '@tanstack/react-table'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends object, TValue> {
    isSticky?: boolean
    tooltip?: string
  }
}
