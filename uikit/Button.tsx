import type { ButtonFlavorProps } from './ButtonFlavor'

import { useClickableElementRef } from '../hooks/useClickableElement'
import { buttonFlavor } from './ButtonFlavor'
import type { DivProps } from './Div'
import { Div } from '.'

export interface ButtonProps extends DivProps<'button'>, ButtonFlavorProps {
  onClick?: () => void
}

export default function Button({ domRef, onClick, flavor, noDefaultFlavor, className, ...restProps }: ButtonProps) {
  const ref = useClickableElementRef({ onClick })
  const baseFlavor = buttonFlavor(flavor)
  return (
    <Div {...restProps} className={['Button', !noDefaultFlavor && baseFlavor, className]} domRef={[ref, domRef]}>
      {restProps.children ?? '🤨'}
    </Div>
  )
}
