/** JS 颜色材料的 Variable 入口。
 *
 * 包装材料并定义基础色、用途色和交互状态的变量关系。
 *
 * 颜色来源由 JS 持有，浏览器按输出的依赖关系响应局部覆盖。
 */
import type { ColorMaterial } from '@/color-system'
import { variable, type Variable } from '../../../../variable'
import { variableCluster } from '../../../../variable-cluster'
import { createJSSContent } from '../../../../content'
import { oklch } from '../../functions/oklch'
import { modification } from '../../../../modification'
import { relativeOKLCH } from '../../functions/relative-oklch'
import { add } from '../../functions/calc'
import { colorMix } from '../../functions/color-mix'
import { paper, ink, neutral } from './palette'
import { brand } from './brand-color'
import { highlightColor, highlightColors } from './ui-action-colors'

/**
 * 将 Color System 的颜色创建为可声明、引用的 JSS Variable。
 * @example
 * // 用纸色定义表面变量；样式可局部声明另一颜色。
 * const surface = toJSSColor(paper, 'example-surface')
 * declare(surface, 'white')
 */
export function toJSSColor(color: ColorMaterial, name: string): Variable {
  return variable(oklch({ ...color.base, alpha: color.alpha }), name)
}

/**
 * 返回从 original 到 target 的颜色 Modification；通道差值由保存的回调计算，alpha 变化在构造时确定。
 */
export const createColorModificationByDiff = ({ original, target }: { original: ColorMaterial; target: ColorMaterial }) =>
  modification({ type: 'color', detail: {
    lightness: currentExpression => add(currentExpression, target.base.lightness - original.base.lightness),
    chroma: currentExpression => add(currentExpression, target.base.chroma - original.base.chroma),
    hue: currentExpression => add(currentExpression, target.base.hue - original.base.hue),
    alpha: target.alpha === original.alpha ? undefined : target.alpha ?? 1,
  } })

export const paperColor = toJSSColor(paper, 'paper-color')
export const inkColor = toJSSColor(ink, 'ink-color')
export const brandColor = toJSSColor(brand, 'brand-color')
export const neutralColor = toJSSColor(neutral, 'neutral-color')

/**
 * 状态展开仍保留当前 CSS 变量引用；未声明时使用原 Variable 的定义作为回退。
 */
export function currentColorReference(source: Variable) {
  return createJSSContent(
    (resolve) => {
      const fallback = resolve(source)
      return fallback === undefined ? `var(${source.toCSSString()})` : `var(${source.toCSSString()}, ${fallback})`
    },
    [source],
  )
}

export const canvasColor = variable(currentColorReference(paperColor), 'canvas-color')
export const surfaceColor = variable(currentColorReference(paperColor), 'surface-color')
export const foregroundColor = variable(currentColorReference(inkColor), 'foreground-color')
export const foregroundColorInteractive = variable(currentColorReference(foregroundColor), {
  name: 'foreground-color-interactive',
  states: {
    hover: currentColorReference(foregroundColor),
    active: currentColorReference(foregroundColor),
    disabled: (source) => source,
  },
})
const currentSurfaceColor = currentColorReference(surfaceColor)
/** 表面交互只对纸色材料调整明度，保留当前表面变量的局部覆盖。 */
export const surfaceColorInteractive = variable(currentSurfaceColor, {
  name: 'surface-color-interactive',
  registration: { syntax: '*', inherits: true },
  states: {
    hover: relativeOKLCH(currentSurfaceColor, modification({ type: 'color', detail: {
      lightness: currentExpression => add(currentExpression, -0.04),
    } })),
    active: relativeOKLCH(currentSurfaceColor, modification({ type: 'color', detail: {
      lightness: currentExpression => add(currentExpression, -0.08),
    } })),
  },
})
const currentForegroundColor = currentColorReference(foregroundColor)
export const lineColor = variable(colorMix([currentForegroundColor, 0.18], 'transparent'), 'line-color')
export const softLine = colorMix([currentColorReference(lineColor), 0.72], 'transparent')
export const hoverOverlay = colorMix([currentForegroundColor, 0.08], 'transparent')
export const activeOverlay = colorMix([currentForegroundColor, 0.14], 'transparent')

export const toneColor = variable(currentColorReference(highlightColor), 'tone-color')
export const toneColors = variableCluster({
  default: toneColor,
  soft: variable(currentColorReference(highlightColors('soft')), 'tone-color-soft'),
  strong: variable(currentColorReference(highlightColors('strong')), 'tone-color-strong'),
  foreground: variable(currentColorReference(highlightColors('foreground')), 'tone-color-foreground'),
  line: variable(currentColorReference(highlightColors('line')), 'tone-color-line'),
})
const currentToneSoftColor = currentColorReference(toneColors('soft'))
export const surfaceColorTone = variable(colorMix([currentSurfaceColor, 0.76], currentToneSoftColor), {
  name: 'surface-color-tone',
  states: {
    hover: colorMix([currentSurfaceColor, 0.66], currentToneSoftColor),
    active: colorMix([currentSurfaceColor, 0.56], currentToneSoftColor),
  },
})
