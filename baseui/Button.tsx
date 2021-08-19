import Div from './Div'
import type { DivProps } from './Div'

export interface ButtonProps extends DivProps<'button'> {
  /**
   * @cssProps
   * @default 'fill'
   */
  type?: 'fill' | 'outline' | 'text'
  /**
   * @cssProps
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large'
}
export default function Button({
  size = 'medium',
  type = 'fill',
  children,
  ...restProps
}: ButtonProps) {
  return (
    <Div
      as='button'
      className={[
        'appearance-none cursor-pointer select-none w-max',
        {
          small: 'py-0 px-2 text-sm rounded',
          medium: 'py-1.5 px-4 text-base rounded-md',
          large: 'py-3 px-6 text-lg rounded-lg'
        }[size],
        {
          outline: `relative bg-transparent ring-inset  ${size === 'large' ? 'ring-2' : size === 'small' ? 'ring-1' : 'ring-2'} ring-opacity-80 ring-fill-dark`,
          fill: 'relative bg-fill-dark text-text-light hover:before:brightness-125 active:before:brightness-90',
          text: 'text-text-dark bg-transparent'
        }[type]
      ]}
      {...restProps}
    >
      {children ?? '🤨'}
    </Div>
  )
}
