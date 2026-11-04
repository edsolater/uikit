/** Card 示例的排列与文字层次。 */
import { rules, baseSpace, multiply, contentColorTheme, surfaceColorTheme, colorMix } from '@/style-system'

rules('.card-example-grid', {
  display: 'grid',
  'grid-template-columns': 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: multiply(baseSpace, 1.5),
})
rules('.card-example-item strong', { color: contentColorTheme })
rules('.card-example-item span', {
  color: colorMix([contentColorTheme, 0.7], [surfaceColorTheme, 0.3]),
  'line-height': 1.5,
})
