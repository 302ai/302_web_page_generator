'use client'

import * as React from 'react'
import { Provider } from 'react-redux'
import store from '@/store'

export function GlobalProvider({ children }: { children: React.ReactElement }) {
  return <Provider store={store}>{children}</Provider>
}
