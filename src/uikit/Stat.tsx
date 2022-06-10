import React, { ReactNode } from 'react'
import { createContextStore } from '../functions/react/createContextStore'
import { useRecordedEffect } from '../hooks/useRecordedEffect'
import Div from './Div'

const { ContextProvider: Provider, useStore: useProviderData } = createContextStore<{
  label?: string
  number?: number
  type?: 'increase' | 'decrease'
}>({})

/**
 * @componentCategory context Component
 */
export default function Stat({ children }: { children?: ReactNode }) {
  return <Provider>{children}</Provider>
}
Stat.displayName = '__StatRoot' // all component startWith "__" will not be shown in react devtool

Stat.Label = function StatLabel({ children }: { children?: string }) {
  const { label, setLabel } = useProviderData()
  useRecordedEffect(
    ([labelText]) => {
      if (labelText && label !== labelText) {
        setLabel(labelText)
      }
    },
    [children]
  )

  return <Div>{children}</Div>
}
