import React from 'react'
import { SKeyof } from '@edsolater/fnkit'
import { createXStore, useXStore } from '@edsolater/xstore'
import { ButtonProps } from '../components/Button'
import { DivProps } from '../components/Div/Div'

type UIKitThemeProps = {
  Div: DivProps
  Button: ButtonProps
}

const uikitThemeAtom = createXStore<UIKitThemeProps>({
  name: 'uikitTheme'
})

/**
 * React hooks
 */
export function useUikitTheme<T extends keyof UIKitThemeProps>(kitName: T): UIKitThemeProps[T] | undefined {
  return useXStore(uikitThemeAtom)[kitName]
}
