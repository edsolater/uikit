/** 颜色材料的 JSS 转换与用途成员构造。
 *
 * 转换材料、计算变化配方，并按来源 Variable 创建颜色族成员及可读前景。
 *
 * 共用构造依赖颜色与样式基础能力，各用途定义可单向复用。
 */
import { modification } from '@/style-system/modification'
import type { ValueInput } from '@/style-system/value'
import { type Variable, variable } from '@/style-system/variable'
import { relativeOKLCH } from '../../functions/relative-oklch'
import { createJSSContent } from '@/style-system/content'
import { colorMix } from '../../functions/color-mix'
import type { ColorMaterial } from '@/color-system'
import { oklch } from '../../functions/oklch'
import { add } from '../../functions/calc'

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

/**
 * 按浅底、边线透明度和前景来源生成颜色族成员，名称沿用 base 的地址。
 * strong 是完整颜色内容；省略时沿用 base。返回成员结构，由定义端聚合为 VariableCluster。
 */
export function baseUIColorStructure({
  base,
  softAlpha,
  lineAlpha,
  foreground,
  strong,
}: {
  base: Variable
  softAlpha: number
  lineAlpha: number
  foreground: ValueInput
  strong?: ValueInput
}) {
  return {
    default: base,
    strong: strong === undefined ? base : variable(strong, `${base.name}-strong`),
    soft: variable(
      relativeOKLCH(base, modification({ type: 'color', detail: { alpha: softAlpha } })),
      `${base.name}-soft`,
    ),
    line: variable(
      relativeOKLCH(base, modification({ type: 'color', detail: { alpha: lineAlpha } })),
      `${base.name}-line`,
    ),
    foreground: variable(foreground, `${base.name}-foreground`),
  }
}

/**
 * 由当前底色求可读前景，并按原配方保留少量底色气息。
 */
export function readableForeground(base: Variable) {
  const contrast = createJSSContent(
    (resolve) => {
      const source = resolve(base)
      return source === undefined ? undefined : `contrast-color(${source})`
    },
    [base],
  )
  return colorMix([contrast, 0.8], [base, 0.2])
}
