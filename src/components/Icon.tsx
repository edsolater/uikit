import { ICSSObject } from '../styles'
import { Div } from './Div'
import { uikit } from './utils'

export interface IconProps {
  /** @default 'currentColor' */
  cssColor?: ICSSObject['color']
  /** sx: 12px; sm: 16px; smi: 20px; md: 24px; lg: 32px (default: md) */
  size?: 'xs' | 'sm' | 'smi' | 'md' | 'lg'
  src?: string
}

export const Icon = uikit('Icon', (KitRoot) => ({ cssColor = 'currentcolor', size = 'md', src }: IconProps) => {
  const sizePx = size === 'xs' ? 12 : size === 'sm' ? 16 : size === 'smi' ? 20 : size === 'md' ? 24 : 32

  return (
    <KitRoot>
      <Div
        icss={{
          position: 'relative',
          '::before': {
            content: "''",
            position: 'absolute',
            inset: 0,
            backgroundColor: cssColor,
            mask: `url(${src})`,
            maskSize: 'cover'
          },
          width: sizePx,
          height: sizePx
        }}
      />
    </KitRoot>
  )
})
