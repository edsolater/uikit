/** 颜色材料的 JSS 转换与用途成员构造。
 *
 * 转换材料，并按来源 Variable 创建颜色族成员及可读内容色。
 *
 * 共用构造依赖颜色与样式基础能力，各用途定义可单向复用。
 */
import type { ValueInput } from '@/style-system/value'
import { type Variable, variable } from '@/style-system/variable'
import { createJSSContent } from '@/style-system/content'
import { colorMix } from '../../functions/color-mix'
import type { ColorMaterial } from '@/color-system'
import { oklch } from '../../functions/oklch'

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
 * 按内容色来源生成颜色族成员，名称沿用 base 的地址；浅底透明度默认 0.14，边线默认 0.44。
 * strong 是完整颜色内容；省略时沿用 base。返回成员结构，由定义端聚合为 VariableCluster。
 */
export function baseUIColorStructure({
  base,
  softAlpha = 0.14,
  lineAlpha = 0.44,
  content,
  strong,
}: {
  base: Variable
  softAlpha?: number
  lineAlpha?: number
  content: ValueInput
  strong?: ValueInput
}) {
  return {
    default: base,
    strong: strong === undefined ? base : variable(strong, `${base.name}-strong`),
    soft: variable(
      oklch(base, { alpha: softAlpha }),
      `${base.name}-soft`,
    ),
    line: variable(
      oklch(base, { alpha: lineAlpha }),
      `${base.name}-line`,
    ),
    content: variable(content, `${base.name}-content`),
  }
}

/**
 * 由当前底色求可读内容色，并按原配方保留少量底色气息。
 */
export function readableContent(base: Variable) {
  const contrast = createJSSContent(
    (resolve) => {
      const source = resolve(base)
      return source === undefined ? undefined : `contrast-color(${source})`
    },
    [base],
  )
  return colorMix([contrast, 0.8], [base, 0.2])
}
