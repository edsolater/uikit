/** 提升容器和锚点的共享视觉。 */
import { rules, token, boundaryColorTheme } from '@/style-system'

export const topLayerShadow = token('0 16px 32px rgb(0 0 0 / 18%)', {
  name: 'top-layer-shadow',
  address: ':root',
})

rules(['@layer reset', ':where(.top-layer)'], {
  border: 0,
  padding: 0,
  background: 'transparent',
  color: 'inherit',
})
rules(['@layer uikit', '.top-layer'], { 'box-shadow': topLayerShadow })
rules(['@layer uikit', '.top-layer-anchor'], { 'pointer-events': 'none' })
rules(['@layer uikit', '.top-layer-anchor', '&::after'], {
  'content': '""',
  'position': 'absolute',
  'inset': 0,
  'box-sizing': 'border-box',
  'border-width': '2px',
  'border-style': 'dashed',
  'border-color': boundaryColorTheme,
  'border-radius': 'inherit',
  'corner-shape': 'inherit',
  'border-shape': 'inherit',
  'pointer-events': 'none',
})
