import type { DivProps } from './Div'
import UIRoot from './UIRoot'
import { useClickableElementRef } from '../hooks/useClickableElement'

export interface ButtonProps extends DivProps<'button'> {
  onClick?: () => void
}

export const buttonBaseStyle = ({
  size = 'medium',
  type = 'fill'
}: {
  /**
   * @default 'fill'
   */
  type?: 'fill' | 'outline' | 'text'
  /**
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large'
} = {}) =>
  [
    'appearance-none cursor-pointer select-none w-max',
    {
      small: 'py-0 px-2 text-sm rounded',
      medium: 'py-1.5 px-4 text-base rounded-md',
      large: 'py-3 px-6 text-lg rounded-lg'
    }[size],
    {
      outline: `relative ring-inset ${
        size === 'large' ? 'ring-2' : size === 'small' ? 'ring-1' : 'ring-2'
      } ring-opacity-80 ring-block-dark`,
      fill: 'relative bg-block-dark text-text-light hover:brightness-125 active:brightness-90',
      text: 'text-text-dark bg-transparent'
    }[type]
  ].join(' ')

export default function Button({ onClick, ...restProps }: ButtonProps) {
  const ref = useClickableElementRef({ onClick })
  return (
    <UIRoot {...restProps} _className={Button.name} _domRef={ref}>
      {restProps.children ?? '🤨'}
    </UIRoot>
  )
}
