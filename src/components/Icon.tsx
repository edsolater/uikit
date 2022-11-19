import { addDefault } from '@edsolater/fnkit'
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

export const Icon = uikit('Icon', (KitRoot) => (rawProps: IconProps) => {
  const props = addDefault(rawProps, { size: 'md', cssColor: 'currentcolor' })

  const sizePx =
    props.size === 'xs' ? 12 : props.size === 'sm' ? 16 : props.size === 'smi' ? 20 : props.size === 'md' ? 24 : 32

  return (
    <KitRoot>
      <Div
        icss={{
          position:'relative',
          '::before':{
            content:"''",
            position:'absolute',
            inset:0,
            backgroundColor: props.cssColor,
            mask: `url(${props.src})`,
            maskSize: 'cover',
          },
          width: sizePx,
          height: sizePx
        }}
      />
    </KitRoot>
  )
})
