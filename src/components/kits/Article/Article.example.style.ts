/** Article 示例中的契约说明样式。 */
import {
  rules,
  baseSpace,
  baseRadius,
  baseBorderWidth,
  surfaceColorTheme,
  contentColorTheme,
  boundaryColorTheme,
  accentColorTheme,
  textSize,
  fontWeight,
  multiply,
  colorMix,
  boundary,
} from '@/style-system'

rules('.article-example-contract', [
  {
    'min-block-size': '220px',
    'display': 'grid',
    'align-content': 'center',
    'gap': baseSpace,
    'padding': multiply(baseSpace, 3),
    'background': surfaceColorTheme,
  },
  boundary({
    border: [baseBorderWidth, 'solid', boundaryColorTheme],
    radius: multiply(baseRadius, 2),
  }),
])
rules('.article-example-contract span', {
  'color': accentColorTheme,
  'font-size': multiply(textSize, 0.75),
  'font-weight': multiply(fontWeight, 1.25),
})
rules('.article-example-contract code', {
  'color': contentColorTheme,
  'font-size': textSize,
})
rules('.article-example-contract strong', {
  'color': colorMix([contentColorTheme, 0.7], [surfaceColorTheme, 0.3]),
  'font-weight': fontWeight,
})
