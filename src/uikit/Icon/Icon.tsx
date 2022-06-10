import Div, { DivProps } from '../Div'

export type IconProps = Omit<DivProps, 'as' | 'nodeName'> & {
  /** sx: 12px; sm: 16px; smi: 20px; md: 24px; lg: 32px (default: md) */
  size?: 'xs' | 'sm' | 'smi' | 'md' | 'lg'
}

export default function Icon({ size, ...props }: IconProps) {
  return (
    <Div
      className_='Icon'
      {...props}
      icss_={
        size === 'lg'
          ? { width: 32, height: 32 }
          : size === 'md'
          ? { width: 24, height: 24 }
          : size === 'smi'
          ? { width: 20, height: 20 }
          : size === 'sm'
          ? { width: 16, height: 16 }
          : size === 'xs'
          ? { width: 12, height: 12 }
          : undefined
      }
    />
  )
}
