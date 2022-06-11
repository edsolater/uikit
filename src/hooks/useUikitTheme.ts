import { type SKeyof } from '@edsolater/fnkit'
import { createXStore, useXStore } from '@edsolater/xstore'
import { ButtonProps } from '../components/Button'
import { DivProps } from '../components/Div'

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
export function useUikitTheme(kitName: SKeyof<UIKitThemeProps>) {
  return useXStore(uikitThemeAtom)[kitName]
}

export const setUIKitTheme = uikitThemeAtom.set
