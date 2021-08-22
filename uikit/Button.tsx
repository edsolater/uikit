import type { ButtonSkinProps } from './ButtonSkin'
import type { DivProps } from './Div'
import UIRoot from './UIRoot'
import ButtonSkin from './ButtonSkin'

export interface ButtonProps extends DivProps<'button'>, ButtonSkinProps {}
export default function Button({ as = ButtonSkin, ...restProps }: ButtonProps) {
  return <UIRoot {...restProps} as={as}></UIRoot>
}
