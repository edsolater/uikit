/** 范围控件拥有自己的尺寸与主题色。 */
import { rules, brandColorTheme, controlSize, multiply } from '@/style-system'

rules(['@layer uikit', '.InputRange'], {
  'width': '100%',
  'min-height': multiply(controlSize, 5 / 6),
  'accent-color': brandColorTheme,
})
