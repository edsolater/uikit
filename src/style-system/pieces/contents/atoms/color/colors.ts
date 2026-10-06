/** JS 颜色材料的 Variable 入口。
 *
 * 包装材料并定义基础色、用途色和交互状态的变量关系。
 *
 * 颜色来源由 JS 持有，浏览器按输出的依赖关系响应局部覆盖。
 */
import type { ColorMaterial } from '../../../../../color-system/core'
import { alpha, chroma, lightness } from '../../../../../color-system/tools/channels'
import { variable, type Variable } from '../../../../variable'
import { variableCluster } from '../../../../variable-cluster'
import { value, type ValueInput } from '../../../../value'
import { createJSSContent } from '../../../../content'
import { oklch } from '../../functions/oklch'
import { deriveColor } from '../../functions/compose-relative-oklch'
import { colorMix } from '../../functions/color-mix'
import { paper, ink, neutral } from './palette'
import { brand, interactive, highlight } from './brand-color'
import { good, bad, warn, info } from './info-color'

/**
 * 将 Color System 的颜色创建为可声明、引用的 JSS Variable。
 * @example
 * // 用纸色定义表面变量；样式可局部声明另一颜色。
 * const surface = toJSSColor(paper, 'example-surface')
 * surface.declare('white')
 */
function toJSSColor(color: ColorMaterial, name: string): Variable {
  return variable(oklch({ ...color.base, alpha: color.alpha }), name)
}

/**
 * 将两份颜色的变化应用到来源当前的 CSS 颜色上，返回保留目标颜色的 Value。
 *
 * 明度、色度和色相使用 target 相对 original 的差值；透明度未变化时跟随来源，
 * 变化时使用 target.alpha，省略按完全不透明处理。
 * @example
 * // 悬停时从当前表面颜色降低明度，局部覆盖表面后仍从覆盖后的颜色派生。
 * applyColorChange(currentColorReference(surfaceColor), {
 *   original: paper,
 *   target: lightness(paper, (current) => current - 0.04),
 * })
 * // 从当前品牌色派生透明度为 0.14 的柔和底色，保留其三个颜色通道。
 * applyColorChange(currentColorReference(brandColor), {
 *   original: brand,
 *   target: alpha(brand, 0.14),
 * })
 */
function applyColorChange(source: ValueInput, { original, target }: { original: ColorMaterial; target: ColorMaterial }) {
  const expression = deriveColor(source, {
    channels: { alpha: target.alpha === original.alpha ? undefined : (target.alpha ?? 1) },
    adjustments: {
      lightness: target.base.lightness - original.base.lightness,
      chroma: target.base.chroma - original.base.chroma,
      hue: target.base.hue - original.base.hue,
    },
  })
  return value(target, { dependencies: [expression], toCSSString: (_, resolve) => resolve(expression) })
}

export const paperColor = toJSSColor(paper, 'paper-color')
export const inkColor = toJSSColor(ink, 'ink-color')
export const brandColor = toJSSColor(brand, 'brand-color')
export const neutralColor = toJSSColor(neutral, 'neutral-color')

/** 为已有基础 Variable 配置语气成员，派生始终读取其当前颜色。 */
function colorMembers(
  name: string,
  material: ColorMaterial,
  base: Variable,
  lineAlpha: number,
  strongMaterial: ColorMaterial = material,
  foreground: ValueInput = currentColorReference(paperColor),
) {
  const currentBase = currentColorReference(base)
  return variableCluster({
    default: base,
    strong:
      strongMaterial === material
        ? base
        : variable(applyColorChange(currentBase, { original: material, target: strongMaterial }), `${name}-color-strong`),
    soft: variable(applyColorChange(currentBase, { original: material, target: alpha(material, 0.14) }), `${name}-color-soft`),
    line: variable(applyColorChange(currentBase, { original: material, target: alpha(material, lineAlpha) }), `${name}-color-line`),
    foreground: variable(foreground, `${name}-color-foreground`),
  })
}

/** 状态展开仍保留当前 CSS 变量；回退由原 Variable 的 JS 定义提供。 */
function currentColorReference(source: Variable) {
  return createJSSContent(
    (resolve) => {
      const fallback = resolve(source)
      return fallback === undefined ? `var(${source.toCSSString()})` : `var(${source.toCSSString()}, ${fallback})`
    },
    [source],
  )
}

/** 由当前底色求可读前景，并按原配方保留少量底色气息。 */
function readableForeground(base: Variable) {
  const currentBase = currentColorReference(base)
  const contrast = createJSSContent(
    (resolve) => {
      const source = resolve(currentBase)
      return source === undefined ? undefined : `contrast-color(${source})`
    },
    [currentBase],
  )
  return colorMix([contrast, 0.8], [currentBase, 0.2])
}

const currentBrandColor = currentColorReference(brandColor)

const interactiveDefault = variable(currentBrandColor, {
  name: 'interactive-color',
  registration: { syntax: '*', inherits: true },
  states: {
    hover: applyColorChange(currentBrandColor, {
      original: interactive,
      target: chroma(
        lightness(interactive, (current) => current - 0.04),
        (current) => current + 0.01,
      ),
    }),
    active: applyColorChange(currentBrandColor, {
      original: interactive,
      target: chroma(
        lightness(interactive, (current) => current - 0.08),
        (current) => current - 0.01,
      ),
    }),
  },
})
export const interactiveColor = colorMembers('interactive', interactive, interactiveDefault, 0.48)
export const highlightColor = colorMembers(
  'highlight',
  highlight,
  variable(applyColorChange(currentBrandColor, { original: brand, target: highlight }), 'highlight-color'),
  0.42,
  chroma(
    lightness(highlight, (current) => current + 0.08),
    (current) => current + 0.02,
  ),
)
const goodDefault = toJSSColor(good, 'good-color')
const warnDefault = toJSSColor(warn, 'warn-color')
const infoDefault = toJSSColor(info, 'info-color')
export const goodColor = colorMembers('good', good, goodDefault, 0.44, good, readableForeground(goodDefault))
export const badColor = colorMembers('bad', bad, toJSSColor(bad, 'bad-color'), 0.44)
export const warnColor = colorMembers('warn', warn, warnDefault, 0.44, warn, readableForeground(warnDefault))
export const infoColor = colorMembers('info', info, infoDefault, 0.44, info, readableForeground(infoDefault))

export const canvasColor = variable(currentColorReference(paperColor), 'canvas-color')
export const surfaceColor = variable(currentColorReference(paperColor), 'surface-color')
const foregroundDefault = variable(currentColorReference(inkColor), 'foreground-color')
export const foregroundColor = variableCluster({
  default: foregroundDefault,
  strong: foregroundDefault,
})
export const foregroundColorInteractive = variable(currentColorReference(foregroundColor), {
  name: 'foreground-color-interactive',
  states: {
    hover: currentColorReference(foregroundColor('strong')),
    active: currentColorReference(foregroundColor('strong')),
    disabled: (source) => source,
  },
})
const currentSurfaceColor = currentColorReference(surfaceColor)
/** 表面交互只对纸色材料调整明度，保留当前表面变量的局部覆盖。 */
export const surfaceColorInteractive = variable(currentSurfaceColor, {
  name: 'surface-color-interactive',
  registration: { syntax: '*', inherits: true },
  states: {
    hover: applyColorChange(currentSurfaceColor, {
      original: paper,
      target: lightness(paper, (current) => current - 0.04),
    }),
    active: applyColorChange(currentSurfaceColor, {
      original: paper,
      target: lightness(paper, (current) => current - 0.08),
    }),
  },
})
const currentForegroundColor = currentColorReference(foregroundColor)
export const lineColor = variable(colorMix([currentForegroundColor, 0.18], 'transparent'), 'line-color')
export const softLine = colorMix([currentColorReference(lineColor), 0.72], 'transparent')
export const hoverOverlay = colorMix([currentForegroundColor, 0.08], 'transparent')
export const activeOverlay = colorMix([currentForegroundColor, 0.14], 'transparent')

export const toneColor = variableCluster({
  default: variable(currentColorReference(highlightColor), 'tone-color'),
  soft: variable(currentColorReference(highlightColor('soft')), 'tone-color-soft'),
  strong: variable(currentColorReference(highlightColor('strong')), 'tone-color-strong'),
  foreground: variable(currentColorReference(highlightColor('foreground')), 'tone-color-foreground'),
  line: variable(currentColorReference(highlightColor('line')), 'tone-color-line'),
})
const currentToneSoftColor = currentColorReference(toneColor('soft'))
export const surfaceColorTone = variable(colorMix([currentSurfaceColor, 0.76], currentToneSoftColor), {
  name: 'surface-color-tone',
  states: {
    hover: colorMix([currentSurfaceColor, 0.66], currentToneSoftColor),
    active: colorMix([currentSurfaceColor, 0.56], currentToneSoftColor),
  },
})
