import type { UseButtonClassName } from './classNameHooks/useButtonClassName'
import type { DivProps } from './Div'
import UIRoot from './UIRoot'
import useButtonClassName from './classNameHooks/useButtonClassName'

export interface ButtonProps extends DivProps<'button'>, UseButtonClassName {}

export default function Button(props: ButtonProps) {
  const defaultClassName = useButtonClassName(props)
  return (
    <UIRoot {...props} _className={[Button.name, defaultClassName, props.className]}>
      {props.children ?? '🤨'}
    </UIRoot>
  )
}
