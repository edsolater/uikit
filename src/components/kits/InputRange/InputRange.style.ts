/**
 * InputRange 的原生范围控件样式。
 *
 * 为原生滑块提供整行宽度、可交互高度与当前品牌主题色。
 *
 * 让范围编辑沿用共同控件尺度，同时保留浏览器的原生轨道和滑块行为。
 */
import { componentName } from './InputRange.prop'
import { rules, brandColorTheme, controlSize, multiply } from '@/style-system'

rules(['@layer uikit', `.${componentName}`], {
  'width': '100%',
  'min-height': multiply(controlSize, 5 / 6),
  'accent-color': brandColorTheme,
})
