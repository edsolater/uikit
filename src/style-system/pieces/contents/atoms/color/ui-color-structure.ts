import { modification } from '@/style-system/modification'
import type { ValueInput } from '@/style-system/value'
import { type Variable, variable } from '@/style-system/variable'
import { relativeOKLCH } from '../../functions/relative-oklch'
import { currentColorReference } from './colors'
import { createJSSContent } from '@/style-system/content'
import { colorMix } from '../../functions/color-mix'

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
  const currentBase = currentColorReference(base)
  return {
    default: base,
    strong: strong === undefined ? base : variable(strong, `${base.name}-strong`),
    soft: variable(
      relativeOKLCH(currentBase, modification({ type: 'color', detail: { alpha: softAlpha } })),
      `${base.name}-soft`,
    ),
    line: variable(
      relativeOKLCH(currentBase, modification({ type: 'color', detail: { alpha: lineAlpha } })),
      `${base.name}-line`,
    ),
    foreground: variable(foreground, `${base.name}-foreground`),
  }
}

/**
 * 由当前底色求可读前景，并按原配方保留少量底色气息。
 */
export function readableForeground(base: Variable) {
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
