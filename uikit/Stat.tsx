import React, { ReactNode } from 'react'
import createStore from '../functions/react/createStore'
import useStateDiffEffect from '../hooks/useStateDiffEffect'
import Div from './Div'

const { Provider, useProviderData } = createStore<{
  label?: string
  number?: number
  type?: 'increase' | 'decrease'
}>({ key: 'Stat' })

/**
 * @componentCategory context Component
 */
export default function Stat({ children }: { children?: ReactNode }) {
  return <Provider>{children}</Provider>
}
Stat.displayName = '__StatRoot' // all component startWith "__" will not be shown in react devtool

Stat.Label = function StatLabel({ children }: { children?: string }) {
  const { label, setLabel } = useProviderData()
  useStateDiffEffect([children], ([labelText]) => {
    if (labelText && label !== labelText) {
      setLabel(labelText)
    }
  })

  return <Div>{children}</Div>
}
