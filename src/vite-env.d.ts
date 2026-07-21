/// <reference types="vite/client" />

import '@tanstack/react-table'

declare module '@tanstack/react-table' {
  interface ColumnMeta<_TData extends object, _TValue> {
    isSticky?: boolean
    tooltip?: string
  }
}
