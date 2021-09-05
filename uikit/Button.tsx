import type { UseButtonClassName } from '../hooks/classNameHooks/useButtonClassName'
import type { DivProps } from './Div'
import UIRoot from './UIRoot'
import useButtonClassName from '../hooks/classNameHooks/useButtonClassName'
import { useClickableElementRef } from '../hooks/useClickableElement'

export interface ButtonProps extends DivProps<'button'>, UseButtonClassName {
  onClick?: () => void
}

export default function Button({ onClick, ...restProps }: ButtonProps) {
  const defaultClassName = useButtonClassName(restProps)
  const ref = useClickableElementRef({ onClick })
  return (
    <UIRoot
      {...restProps}
      _className={[Button.name, defaultClassName, restProps.className]}
      _domRef={ref}
    >
      {restProps.children ?? '🤨'}
    </UIRoot>
  )
}
