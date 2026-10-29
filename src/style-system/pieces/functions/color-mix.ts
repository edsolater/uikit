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
  isJSSContent,
  type JSSContentResolver,
} from '../../content'
import { token, type Token, type TokenInput } from '../../token'
import { oklch, type OKLCHChanges } from './oklch'

/** 来源颜色及相对 OKLCH 通道；数值设值，回调根据当前通道计算。 */
export interface MixColorDescription extends OKLCHChanges {
  base: TokenInput
}

/** 一份参与混合的颜色；省略权重时采用 CSS 的默认比例。 */
export interface WeightedMixColor {
  color: TokenInput | MixColorDescription
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
      isDirectMix(inputs) ? contentDependencies(inputs) : [produceMix],
    toCSSString: (inputs, resolve) =>
      isDirectMix(inputs) ? formatMix(inputs, resolve) : resolve(produceMix),
  })
  return result

  /** 消费当前颜色描述，生成供依赖扫描和输出共同使用的混色表达式。 */
  function produceMix(): Token {
    return token(result.default.map(prepareMixColor), { toCSSString: formatMix })
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

/** 具名项复用相对颜色能力，后续只处理直接颜色与权重。 */
function prepareMixColor(input: MixColorInput): DirectMixColor {
  if (!isWeightedMixColor(input)) return input
  const source = input.color
  const color =
    isObject(source) && !isJSSContent(source) && 'base' in source
      ? oklch(source.base, source)
      : source
  return input.weight === undefined ? color : [color, input.weight]
}

/** 两种输入共用同一份混色输出；依赖缺失时不生成不完整颜色。 */
function formatMix(
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
  return parts.some((part) => part === undefined)
    ? undefined
    : `color-mix(in oklab, ${parts.join(', ')})`
}
