import type { DivProps } from './Div'
import UIRoot from './UIRoot'
import { useClickableElementRef } from '../hooks/useClickableElement'
import { ButtonBaseStyleProps, buttonBaseStyle } from './ButtonBaseStyle'
import { BaseStyle } from './interface'

export interface ButtonProps extends DivProps<'button'>, BaseStyle<ButtonBaseStyleProps> {
  onClick?: () => void
}

export default function Button({ onClick, ...restProps }: ButtonProps) {
  const baseStyleClassName = restProps.baseStyle === 'none' ? '' : buttonBaseStyle(restProps.baseStyle)
  const ref = useClickableElementRef({ onClick })
  return (
    <UIRoot {...restProps} _className={[Button.name, baseStyleClassName]} _domRef={ref}>
      {restProps.children ?? '🤨'}
    </UIRoot>
  )
}
