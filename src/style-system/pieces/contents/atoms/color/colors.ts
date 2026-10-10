/** 用途色与交互状态的变量关系。
 *
 * 基础材料由色板与品牌定义，颜色族由各用途文件提供。
 *
 * 直接引用 Variable，让浏览器响应来源的当前状态及局部覆盖。
 */
import { variable } from '../../../../variable'
import { variableCluster } from '../../../../variable-cluster'
import { modification } from '../../../../modification'
import { relativeOKLCH } from '../../functions/relative-oklch'
import { add } from '../../functions/calc'
import { colorMix } from '../../functions/color-mix'
import { paperColor, inkColor } from './palette'
import { highlightColor, highlightColors } from './ui-action-colors'

export { toJSSColor, createColorModificationByDiff } from './ui-color-structure'
export { paperColor, inkColor, neutralColor } from './palette'
export { brandColor } from './brand-color'
export { interactiveColor, interactiveColors, highlightColor, highlightColors } from './ui-action-colors'
export { badColor, badColors } from './ui-info-color'

export const canvasColor = variable(paperColor, 'canvas-color')
export const surfaceColor = variable(paperColor, 'surface-color')
export const foregroundColor = variable(inkColor, 'foreground-color')
export const foregroundColorInteractive = variable(foregroundColor, {
  name: 'foreground-color-interactive',
  states: {
    hover: foregroundColor,
    active: foregroundColor,
    disabled: (source) => source,
  },
})
/** 表面交互只对纸色材料调整明度，保留当前表面变量的局部覆盖。 */
export const surfaceColorInteractive = variable(surfaceColor, {
  name: 'surface-color-interactive',
  registration: { syntax: '*', inherits: true },
  states: {
    hover: relativeOKLCH(surfaceColor, modification({ type: 'color', detail: {
      lightness: currentExpression => add(currentExpression, -0.04),
    } })),
    active: relativeOKLCH(surfaceColor, modification({ type: 'color', detail: {
      lightness: currentExpression => add(currentExpression, -0.08),
    } })),
  },
})
export const lineColor = variable(colorMix([foregroundColor, 0.18], 'transparent'), 'line-color')
export const softLine = colorMix([lineColor, 0.72], 'transparent')
export const hoverOverlay = colorMix([foregroundColor, 0.08], 'transparent')
export const activeOverlay = colorMix([foregroundColor, 0.14], 'transparent')

export const toneColor = variable(highlightColor, 'tone-color')
export const toneColors = variableCluster({
  default: toneColor,
  soft: variable(highlightColors('soft'), 'tone-color-soft'),
  strong: variable(highlightColors('strong'), 'tone-color-strong'),
  foreground: variable(highlightColors('foreground'), 'tone-color-foreground'),
  line: variable(highlightColors('line'), 'tone-color-line'),
})
export const surfaceColorTone = variable(colorMix([surfaceColor, 0.76], toneColors('soft')), {
  name: 'surface-color-tone',
  states: {
    hover: colorMix([surfaceColor, 0.66], toneColors('soft')),
    active: colorMix([surfaceColor, 0.56], toneColors('soft')),
  },
})
