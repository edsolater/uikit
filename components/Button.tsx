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
        'appearance-none border-none cursor-pointer select-none w-max',
        {
          small: 'py-1 px-2 text-sm rounded',
          medium: 'py-1.5 px-3 text-base rounded-md',
          large: 'py-2 px-4 text-lg rounded-lg'
        }[size],
        {
          outline: 'relative bg-transparent bg-gray-100 ',
          fill: 'relative bg-gray-400 text-white hover:before:brightness-125 active:before:brightness-90',
          text: 'text-gray-500 bg-transparent'
        }[type]
      ]}
      {...restProps}
    >
      {children ?? '🤨'}
    </Div>
  )
}
