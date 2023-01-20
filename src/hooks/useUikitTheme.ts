import { createXAtom, useXAtom } from '@edsolater/xstore'
import { ButtonProps } from '../components/Button'
import { DivProps } from '../Div/type'

type UIKitThemeProps = {
  Div: DivProps
  Button: ButtonProps
}

const uikitThemeAtom = createXAtom<UIKitThemeProps>({
  name: 'uikitTheme'
})

/**
 * React hooks
 */
export function useUikitTheme<T extends keyof UIKitThemeProps>(kitName: T): UIKitThemeProps[T] | undefined {
  return useXAtom(uikitThemeAtom)[kitName]
}
