/** 颜色材料与环境的数值表达；颜色处理工具位于 tools。 */
import { mix } from './tools/mix'

export interface OKLCH {
  lightness: number
  chroma: number
  hue: number
}

export interface ColorMaterial {
  /** 基色。 */
  base: OKLCH

  /** 省略等效于 1；base 不包含 Alpha。 */
  alpha?: number

  /** 各通道受环境影响的程度；省略的通道不响应。 */
  environmentSensitivities?: ColorEnvironmentSensitive

  /** 承载内容的表面，或表面上的文字、图标等内容。 */
  purpose: 'surface' | 'content'
}

/** 固定比例，或根据材料自身色值与合成环境计算比例；结果须在 0～1。 */
export type EnvironmentSensitivity = number | ((base: Readonly<OKLCH>, environment: Readonly<ColorEnvironment>) => number)

/** 材料的环境感知规则；每个通道都可读取自身全部 OKLCH 信息。 */
export interface ColorEnvironmentSensitive {
  lightness?: EnvironmentSensitivity
  chroma?: EnvironmentSensitivity
  hue?: EnvironmentSensitivity
}

export interface ColorEnvironment {
  /** 可选环境色；指定的通道按材料感知比例牵引最终色。 */
  tint?: Partial<OKLCH>
  influence?: {
    lightness?: number
    chroma?: number
    hue?: number
  }
}

/** 本次应用的环境及相对权重，不保存在颜色材料中。 */
export interface WeightedEnvironment {
  environment: ColorEnvironment
  weight: number
}

/** 直接传入环境时按权重 1 处理，也可明确指定相对权重。 */
export type EnvironmentInput = ColorEnvironment | WeightedEnvironment

/** 合成指定通道的环境贡献，缺省通道不参与权重。 */
function combineEnvironment(inputs: readonly EnvironmentInput[]): ColorEnvironment {
  const contributions = inputs.map(input => 'environment' in input ? input : { environment: input, weight: 1 })
  if (contributions.some(item => !Number.isFinite(item.weight) || item.weight < 0)) {
    throw new RangeError('环境权重必须是非负有限数值')
  }
  if (contributions.length > 0 && !contributions.some(item => item.weight > 0)) {
    throw new RangeError('本次环境至少需要一项正权重')
  }
  const result: ColorEnvironment = { tint: {}, influence: {} }
  for (const group of ['tint', 'influence'] as const) {
    for (const channel of ['lightness', 'chroma', 'hue'] as const) {
      const provided = contributions.filter(item => item.environment[group]?.[channel] !== undefined && item.weight > 0)
      if (provided.length === 0) continue
      const maximum = provided.reduce((maximum, item) => Math.max(maximum, item.weight), 0)
      const weights = provided.map(item => item.weight / maximum)
      const total = weights.reduce((sum, weight) => sum + weight, 0)
      if (group === 'tint' && channel === 'hue') {
        result.tint!.hue = mix({
          colors: provided.map<ColorMaterial>(item => ({
            base: { lightness: 0.5, chroma: 0.1, hue: item.environment.tint!.hue! },
            purpose: 'content',
          })),
          weights,
        }).base.hue
      } else {
        result[group]![channel] = provided.reduce((sum, item, index) => sum + item.environment[group]![channel]! * (weights[index] / total), 0)
      }
    }
  }
  return result
}



// =============================================================================
// 颜色计算
// =============================================================================

/**
 * 将本次传入的环境应用到颜色，返回可继续处理的颜色材料。
 *
 * 多环境只在本次应用时按权重合成；感知函数读取本次输入的 base 与合成环境。
 * 当前环境公式向 tint 靠近，influence 缺省为 1；缺省感知或 tint 的通道不改变。
 * 结果明度限制在 0～1，色度不低于 0，不舍入。
 *
 * 不修改输入，不保存环境历史；再次应用从返回材料的新 base 开始。
 *
 * @example
 * const changed = applyEnvironment(color, { environment: dark, weight: 3 }, { environment: warm, weight: 1 })
 * const changedAgain = applyEnvironment(changed, dark)
 */
export function applyEnvironment<T extends ColorMaterial>(material: T, ...environments: EnvironmentInput[]): T {
  if (environments.length === 0) return material
  const { base, environmentSensitivities } = material
  const combined = combineEnvironment(environments)
  const result = { ...base }
  for (const channel of ['lightness', 'chroma', 'hue'] as const) {
    const target = combined.tint?.[channel]
    if (target === undefined) continue
    const response = evaluateSensitivity(environmentSensitivities?.[channel], base, combined)
    let difference = target - base[channel]
    if (channel === 'hue') difference = ((difference % 360 + 540) % 360) - 180
    result[channel] += difference * (combined.influence?.[channel] ?? 1) * response
  }

  return {
    ...material,
    base: {
      lightness: Math.min(1, Math.max(0, result.lightness)),
      chroma: Math.max(0, result.chroma),
      hue: ((result.hue % 360) + 360) % 360,
    },
  }
}

/** 根据材料自身色值与合成环境求感知比例；省略为 0，无效结果报错。 */
export function evaluateSensitivity(rule: EnvironmentSensitivity | undefined, base: Readonly<OKLCH>, environment: Readonly<ColorEnvironment>): number {
  const response = typeof rule === 'function' ? rule(base, environment) : rule ?? 0
  if (!Number.isFinite(response) || response < 0 || response > 1) {
    throw new RangeError('环境感知比例必须是 0～1 之间的有限数值')
  }
  return response
}
