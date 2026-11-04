import { rules, baseSpace, baseRadius, baseBorderWidth, contentColorTheme, surfaceColorTheme, boundaryColorTheme, multiply, boundary } from '@/style-system'
rules('.Select', [{
  'box-sizing': 'border-box',
  width: '100%',
  'min-width': '0',
  font: 'inherit',
  padding: baseSpace,
  color: contentColorTheme,
  background: surfaceColorTheme,
}, boundary({ border: [baseBorderWidth, 'solid', boundaryColorTheme], radius: multiply(baseRadius, 2) })])
