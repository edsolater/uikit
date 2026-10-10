/** 用途色与交互状态的变量关系。
 *
 * 基础材料由色板与品牌定义，颜色族由各用途文件提供。
 *
 * 直接引用 Variable，让浏览器响应来源的当前状态及局部覆盖。
 */
import { variable } from '../../../../variable'
import { variableCluster } from '../../../../variable-cluster'
import { colorMix } from '../../functions/color-mix'
import { paperColor, inkColor } from './palette'
import { highlightColor, highlightColors } from './ui-action-colors'
import { interactiveColorStates } from './ui-variable-structure'

export { toJSSColor } from './ui-color-structure'
export { paperColor, inkColor, neutralColor } from './palette'
export { brandColor } from './brand-color'
export { interactiveColor, interactiveColors, highlightColor, highlightColors } from './ui-action-colors'
export { badColor, badColors } from './ui-info-color'

export const globalCanvasColor = variable(paperColor, 'global-canvas-color')
export const globalSurfaceColor = variable(paperColor, 'global-surface-color')
export const globalContentColor = variable(inkColor, 'global-content-color')
/** 表面交互只对纸色材料调整明度，保留当前表面变量的局部覆盖。 */
export const surfaceColorInteractive = variable(interactiveColorStates({ base: globalSurfaceColor }), {
  name: 'surface-color-interactive',
  registration: { syntax: '*', inherits: true },
})
export const lineColor = variable(colorMix([globalContentColor, 0.18], 'transparent'), 'line-color')
export const toneColor = variable(highlightColor, 'tone-color')
export const toneColors = variableCluster({
  default: toneColor,
  soft: variable(highlightColors('soft'), 'tone-color-soft'),
  strong: variable(highlightColors('strong'), 'tone-color-strong'),
  content: variable(highlightColors('content'), 'tone-color-content'),
  line: variable(highlightColors('line'), 'tone-color-line'),
})
