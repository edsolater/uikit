import type { ButtonBaseStyleProps } from './ButtonBaseStyle'
import type { BaseStyle } from './interface'

import { useClickableElementRef } from '../hooks/useClickableElement'
import { buttonBaseStyle } from './ButtonBaseStyle'
import type { DivProps } from './Div'
import { Div } from '.'

export interface ButtonProps extends DivProps<'button'>, BaseStyle<ButtonBaseStyleProps> {
  onClick?: () => void
}

export default function Button({ onClick, baseStyle, className, domRef, ...restProps }: ButtonProps) {
  const baseStyleClasses = buttonBaseStyle(baseStyle)
  const ref = useClickableElementRef({ onClick })
  return (
    <Div {...restProps} className={['Card', baseStyleClasses, className]} domRef={[ref, domRef]}>
      {restProps.children ?? '🤨'}
    </Div>
  )
}
