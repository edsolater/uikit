/**
 * 混色的内容组织。
 *
 * 连接颜色与比例，延迟生成 oklab 混色文本。
 *
 * 保留依赖的编译结果，颜色和比例可随外界状态变化。
 */
import { isObject } from '@edsolater/fnkit'
import {
  contentDependencies,
  createJSSContent,
  isJSSContent,
  type JSSContentResolver,
} from '../../content'
import { token, type Token, type TokenInput } from '../../token'
import { color, type ColorInput } from './color'

/** 一份参与混合的颜色；省略权重时采用 CSS 的默认比例。 */
export interface WeightedMixColor {
  color: ColorInput
  weight?: TokenInput
}

/** 直接颜色、颜色与权重元组，或具名混色项。 */
export type MixColorInput = DirectMixColor | WeightedMixColor

type DirectMixColor = TokenInput | [color: TokenInput, weight: TokenInput]

/**
 * 延迟生成 oklab 混色；比例换算为百分比。
 */
export function colorMix(...colors: MixColorInput[]): Token<MixColorInput[]> {
  const result = token<MixColorInput[]>(colors, {
    dependencies: (inputs) =>
      isDirectMix(inputs) ? contentDependencies(inputs) : [produceItems],
    toCSSString: (inputs, resolve) => {
      const items = isDirectMix(inputs)
        ? formatMixItems(inputs, resolve)
        : resolve(produceItems)
      return items === undefined ? undefined : `color-mix(in oklab, ${items})`
    },
  })
  return result

  /** 消费当前颜色与权重，仅组织参数列表，不再构造另一份混色 Token。 */
  function produceItems() {
    const items = result.default.map<DirectMixColor>((input) => {
      if (!isWeightedMixColor(input)) return input
      const value = color(input.color)
      return input.weight === undefined ? value : [value, input.weight]
    })
    return createJSSContent(
      (resolve) => formatMixItems(items, resolve),
      contentDependencies(items),
    )
  }
}

/** 内容协议优先，避免把 Token 或可调用内容上的同名字段当作配置。 */
function isWeightedMixColor(input: MixColorInput): input is WeightedMixColor {
  return isObject(input) && !isJSSContent(input) && 'color' in input
}

/** 旧输入可直接输出字面量，无须先消费延迟颜色描述。 */
function isDirectMix(inputs: MixColorInput[]): inputs is DirectMixColor[] {
  return !inputs.some(isWeightedMixColor)
}

/** 两种输入共用同一份混色输出；依赖缺失时不生成不完整颜色。 */
function formatMixItems(
  colors: DirectMixColor[],
  resolve: JSSContentResolver,
): string | undefined {
  const parts = colors.map((input) => {
    if (!Array.isArray(input)) return resolve(input)
    const color = resolve(input[0])
    const weight = resolve(input[1])
    if (color === undefined || weight === undefined) return undefined
    const percentage = Number.isFinite(Number(weight))
      ? `${Number(weight) * 100}%`
      : `calc(${weight} * 100%)`
    return `${color} ${percentage}`
  })
  return parts.some((part) => part === undefined) ? undefined : parts.join(', ')
}
