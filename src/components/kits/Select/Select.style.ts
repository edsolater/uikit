/**
 * Select 的原生选择框基础样式。
 *
 * 统一选择框的宽度、字体、内边距与主题边界材料。
 *
 * 保持表单控件的共同视觉尺度，并沿用浏览器的选择交互。
 */
import { componentName } from './Select.prop'
import {
  rules,
  baseSpace,
  baseRadius,
  baseBorderWidth,
  contentColorTheme,
  surfaceColorTheme,
  boundaryColorTheme,
  multiply,
  boundary,
} from '@/style-system'
rules(`.${componentName}`, [
  {
    'box-sizing': 'border-box',
    'width': '100%',
    'min-width': '0',
    'font': 'inherit',
    'padding': baseSpace,
    'color': contentColorTheme,
    'background': surfaceColorTheme,
  },
  boundary({
    border: [baseBorderWidth, 'solid', boundaryColorTheme],
    radius: multiply(baseRadius, 2),
  }),
])
