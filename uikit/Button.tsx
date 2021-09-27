import type { ButtonTintProps } from './ButtonTint'

import { useClickableElementRef } from '../hooks/useClickableElement'
import { buttonTint } from './ButtonTint'
import type { DivProps } from './Div'
import { Div } from '.'

export interface ButtonProps extends DivProps<'button'>, ButtonTintProps {
  onClick?: () => void
}

export default function Button({ domRef, onClick, tint, noDefaultTint, className, ...restProps }: ButtonProps) {
  const ref = useClickableElementRef({ onClick })
  const baseTint = buttonTint(tint)
  return (
    <Div {...restProps} className={['Button', !noDefaultTint && baseTint, className]} domRef={[ref, domRef]}>
      {restProps.children ?? '🤨'}
    </Div>
  )
}
