import { rules, baseSpace, baseRadius, baseBorderWidth, contentColorTheme, surfaceColorTheme, boundaryColorTheme, multiply, boundary } from '@/style-system'
rules('.TextArea', [{
  'box-sizing': 'border-box',
  width: '100%',
  'min-width': '0',
  font: 'inherit',
  padding: baseSpace,
  color: contentColorTheme,
  background: surfaceColorTheme,
  'min-height': '5rem',
  resize: 'vertical',
}, boundary({ border: [baseBorderWidth, 'solid', boundaryColorTheme], radius: multiply(baseRadius, 2) })])
