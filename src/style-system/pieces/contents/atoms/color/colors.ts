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

/**
 * 页面整体的底色，例如卡片之间和组件之外露出的背景，默认引用纸色。
 * Canvas 在这里表示承载页面内容的画布；本变量没有引用浏览器的系统颜色 Canvas。
 * CSS 的 Canvas 本身是颜色值，也能直接作为相对色来源：oklch(from Canvas calc(l - 0.04) c h)。
 */
export const globalCanvasColor = variable(paperColor, 'global-canvas-color')

/** 组件承载面的全局默认底色，例如卡片或按钮的背景；默认引用纸色，与页面底色可分别覆盖。 */
export const globalSurfaceColor = variable(paperColor, 'global-surface-color')

/** 文字及使用当前内容色的图标等内容的全局默认颜色，默认引用墨色。 */
export const globalContentColor = variable(inkColor, 'global-content-color')

/** 表面交互只对纸色材料调整明度，保留当前表面变量的局部覆盖。 */
export const surfaceColorInteractive = variable(
  interactiveColorStates({ base: globalSurfaceColor }),
  'surface-color-interactive',
)
/** 分隔线等线条的颜色，按当前全局内容色的 18% 与透明色混合。 */
export const lineColor = variable(colorMix([globalContentColor, 0.18], 'transparent'), 'line-color')

/** 组件当前选用的主题强调色，默认引用高亮色；组件规则可在自身作用域选择其他配色。 */
export const toneColor = variable(highlightColor, 'tone-color')

/**
 * 组件当前选用的整套配色，默认引用高亮颜色族；各成员表示不同用途，而不是不同状态。
 * 例如普通按钮选择交互品牌颜色族，危险按钮选择危险颜色族，消费处仍使用同一组成员。
 */
export const toneColors = variableCluster({
  /** 基础强调色；直接消费 toneColors 时使用此成员。 */
  default: toneColor,
  /** 浅背景色。 */
  soft: variable(highlightColors('soft'), 'tone-color-soft'),
  /** 较强的强调色，可用于需要突出显示的内容。 */
  strong: variable(highlightColors('strong'), 'tone-color-strong'),
  /** 配色背景上的文字、图标等内容色。 */
  content: variable(highlightColors('content'), 'tone-color-content'),
  /** 边线或轮廓的颜色。 */
  line: variable(highlightColors('line'), 'tone-color-line'),
})
