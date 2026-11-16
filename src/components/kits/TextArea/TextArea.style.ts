/**
 * TextArea 的多行编辑框基础样式。
 *
 * 定义编辑区域的宽度、字体、留白与主题边界材料。
 *
 * 让多行内容具备默认可编辑形态，字段标题与布局由外部组合。
 */
import { componentName } from './TextArea.prop'
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
    'min-height': '5rem',
    'resize': 'vertical',
  },
  boundary({
    border: [baseBorderWidth, 'solid', boundaryColorTheme],
    radius: multiply(baseRadius, 2),
  }),
])
