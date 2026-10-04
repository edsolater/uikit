/** 在 OKLCH 中混合颜色材料，保留来源与环境响应参数。 */

import { evaluateSensitivity, type ColorEnvironmentSensitive, type ColorMaterial } from '../core'

/** 色相沿色环的混合方向；默认最短路径。 */
export type HueInterpolation = 'shorter' | 'longer' | 'increasing' | 'decreasing'

/** 材料混合配置；权重按 colors 顺序对应，省略时等权。 */
export interface MixOptions {
  colors: readonly ColorMaterial[]
  /** 相对权重，不是 CSS 百分比；非负且至少一项大于零。 */
  weights?: readonly number[]
  hue?: HueInterpolation
  /** 不同用途的材料混合时须明确结果用途；相同用途可省略。 */
  purpose?: ColorMaterial['purpose']
}

/** 混合后的材料；来源与归一化权重保留，嵌套混合不展开。 */
export interface MixedColorMaterial extends ColorMaterial {
  sources: readonly { material: ColorMaterial; weight: number }[]
}

/** 取得指定方向的色相角差，输入角度已归一化。 */
function hueDifference(a: number, b: number, method: HueInterpolation): number {
  let difference = b - a
  if (method === 'shorter') {
    if (difference > 180) difference -= 360
    else if (difference < -180) difference += 360
  } else if (method === 'longer') {
    if (difference > 0 && difference < 180) difference -= 360
    else if (difference > -180 && difference <= 0) difference += 360
  } else if (method === 'increasing') {
    if (difference < 0) difference += 360
  } else if (difference > 0) {
    difference -= 360
  }
  return difference
}

/** 将色相回绕到 0～360°。 */
function wrapHue(hue: number): number {
  return ((hue % 360) + 360) % 360
}

/**
 * 按输入顺序混合任意数量的颜色材料，返回仍可响应环境的材料。
 *
 * 色值采用 CSS 的 OKLCH 插值：明度、彩度加权，色相默认走最短路径。
 * 无彩色借用另一方色相；多色的色相结果可能受输入顺序影响。
 * Alpha 单独加权，明度、彩度按 Alpha 预乘后混合；Alpha 为 1 时省略。
 * 环境感知规则按权重合成；函数保留到环境求值时，读取混合材料自身 base。
 * 省略的感知通道按 0 参与；这属于材料规则，不是 CSS 色值规则。
 * 不舍入、不压缩色域，不改变输入；至少传入一种颜色。
 *
 * @example
 * const equal = mix(brand, neutral)
 * const weighted = mix({ colors: [brand, neutral], weights: [3, 1], hue: 'shorter' })
 */
export function mix(...colors: ColorMaterial[]): MixedColorMaterial
export function mix(options: MixOptions): MixedColorMaterial
export function mix(...args: ColorMaterial[] | [MixOptions]): MixedColorMaterial {
  const options: MixOptions = args.length === 1 && 'colors' in args[0]
    ? args[0]
    : { colors: args as ColorMaterial[] }
  const { colors, weights, hue = 'shorter' } = options
  if (colors.length === 0) throw new RangeError('混合至少需要一种颜色')
  if (weights && weights.length !== colors.length) throw new RangeError('权重数量必须与颜色数量一致')
  if (!['shorter', 'longer', 'increasing', 'decreasing'].includes(hue)) {
    throw new RangeError('色相混合方向无效')
  }

  const rawWeights = colors.map((_, index) => weights?.[index] ?? 1)
  let maximum = 0
  for (const weight of rawWeights) {
    if (!Number.isFinite(weight) || weight < 0) throw new RangeError('权重必须是有限的非负数')
    maximum = Math.max(maximum, weight)
  }
  if (maximum === 0) throw new RangeError('至少一种颜色的权重须大于零')
  const scaled = rawWeights.map(weight => weight / maximum)
  const total = scaled.reduce((sum, weight) => sum + weight, 0)
  const sources = colors.map((material, index) => ({ material, weight: scaled[index] / total }))
    .filter(source => source.weight > 0)
  const first = sources[0].material
  const purpose = options.purpose ?? first.purpose
  if (!options.purpose && sources.some(source => source.material.purpose !== purpose)) {
    throw new TypeError('混合不同用途的材料时须指定 purpose')
  }

  let mixedAlpha = first.alpha ?? 1
  let lightness = first.base.lightness * mixedAlpha
  let chroma = first.base.chroma * mixedAlpha
  // CSS 将彩度极低的色相视为无作用；缺失色相由另一方补足。
  let angle: number | undefined = first.base.chroma <= 0.000004 ? undefined : wrapHue(first.base.hue)
  let accumulated = sources[0].weight
  for (const { material, weight } of sources.slice(1)) {
    const t = weight / (accumulated + weight)
    const next = material.base.chroma <= 0.000004 ? undefined : wrapHue(material.base.hue)
    if (angle === undefined) angle = next
    else if (next !== undefined) angle = wrapHue(angle + hueDifference(angle, next, hue) * t)
    const nextAlpha = material.alpha ?? 1
    lightness += (material.base.lightness * nextAlpha - lightness) * t
    chroma += (material.base.chroma * nextAlpha - chroma) * t
    mixedAlpha += (nextAlpha - mixedAlpha) * t
    accumulated += weight
  }

  const environmentSensitivities: ColorEnvironmentSensitive = {}
  for (const channel of ['lightness', 'chroma', 'hue'] as const) {
    if (!sources.some(source => source.material.environmentSensitivities?.[channel] !== undefined)) continue
    if (sources.some(source => typeof source.material.environmentSensitivities?.[channel] === 'function')) {
      environmentSensitivities[channel] = (base, environment) => sources.reduce((sum, { material, weight }) =>
        sum + evaluateSensitivity(material.environmentSensitivities?.[channel], base, environment) * weight, 0)
    } else {
      environmentSensitivities[channel] = sources.reduce((sum, { material, weight }) =>
        sum + evaluateSensitivity(material.environmentSensitivities?.[channel], material.base, {}) * weight, 0)
    }
  }
  return {
    base: { lightness: mixedAlpha > 0 ? lightness / mixedAlpha : lightness, chroma: mixedAlpha > 0 ? chroma / mixedAlpha : chroma, hue: angle ?? 0 },
    ...(mixedAlpha === 1 ? {} : { alpha: mixedAlpha }),
    environmentSensitivities,
    purpose,
    sources,
  }
}
