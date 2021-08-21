import type { DivProps } from './Div'
import type { Uikit } from '../typings/Uikit'
import BaseUIDiv from './BaseUIDiv'

export interface ButtonProps extends DivProps<'button'>, Uikit {
  /**
   * @cssProps only if not use forceClassName
   * @default 'fill'
   */
  type?: 'fill' | 'outline' | 'text'
  /**
   * @cssProps only if not use forceClassName
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large'
}
export default function Button({
  size = 'medium',
  type = 'fill',
  className,
  forceClassName,
  children,
  ...restProps
}: ButtonProps) {
  return (
    <BaseUIDiv
      as='button'
      _className={[
        'Button',
        forceClassName ?? [
          'appearance-none cursor-pointer select-none w-max',
          {
            small: 'py-0 px-2 text-sm rounded',
            medium: 'py-1.5 px-4 text-base rounded-md',
            large: 'py-3 px-6 text-lg rounded-lg'
          }[size],
          {
            outline: `relative ring-inset ${
              size === 'large' ? 'ring-2' : size === 'small' ? 'ring-1' : 'ring-2'
            } ring-opacity-80 ring-fill-dark`,
            fill: 'relative bg-fill-dark text-text-light hover:brightness-125 active:brightness-90',
            text: 'text-text-dark bg-transparent'
          }[type],
          className
        ]
      ]}
      {...restProps}
    >
      {children ?? '🤨'}
    </BaseUIDiv>
  )
}
