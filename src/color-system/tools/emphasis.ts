/**
 * 颜色强调处理。
 *
 * 让近处颜色更清晰、远处颜色逐渐褪入环境。
 *
 * 同步调整材料的环境感知，供后续颜色处理与环境求值使用。
 */
import { evaluateSensitivity, type ColorEnvironment, type ColorEnvironmentSensitive, type ColorMaterial, type OKLCH } from '../core'

/**
 * emphasis:凸显颜色
 * 正向增强颜色特征，负向则融入环境；0 级原样返回基底。
 *
 * 整数用于色阶，小数用于平滑过渡。环境只作参照，不追加贡献。
 * 返回材料仍可响应环境；Alpha 与用途不变，不保存参照环境。
 *
 * @example
 * const near = emphasis(color, environment, 1)
 * const far = emphasis(color, environment, -1)
 */
export function emphasis<T extends ColorMaterial>(color: T, environment: ColorEnvironment, level: number): T {
  if (!Number.isFinite(level)) throw new RangeError('强调级数必须是有限数值')
  if (level === 0) return color

  const target = emphasisTarget(color.base, environment, level)
  const progress = emphasisProgress(level)
  const base = transitionColor(color.base, target, progress)
  const environmentSensitivities = adjustEnvironmentSensitivities(color, environment, level, progress)

  return { ...color, base, environmentSensitivities }
}

/** 确定清晰或褪色的目标：彩色正级增强自身，负级靠近环境，灰色正级增强明暗辨识。 */
function emphasisTarget(base: OKLCH, environment: ColorEnvironment, level: number): OKLCH {
  if (level < 0) return {
    lightness: environment.tint?.lightness ?? base.lightness,
    chroma: environment.tint?.chroma ?? base.chroma,
    hue: environment.tint?.hue ?? base.hue,
  }
  if (base.chroma === 0) {
    return { ...base, lightness: base.lightness >= (environment.tint?.lightness ?? 0.5) ? 1 : 0 }
  }
  return {
    // 增加自身明度的 15% × 剩余明度空间，暗部与亮部都少推，避免一路漂白。
    lightness: base.lightness + 0.15 * base.lightness * (1 - base.lightness),
    // 清晰端点比自身多 30% 彩度；这是待视觉验收的增强幅度，不是显示上限。
    chroma: base.chroma * 1.3,
    hue: base.hue,
  }
}

/** 平滑推进到目标；0 两侧的速度、加速度连续，大级数逐渐趋缓。 */
function emphasisProgress(level: number): number {
  // 0.7 拉开级差：1 级推进约 22%，2 级约 69%；三次方使 0 附近平缓起步。
  return Math.tanh(0.7 * Math.abs(level)) ** 3
}

/** 联合过渡明度与彩色分量；色相由融合自然带出，无彩点不影响实际颜色的连续性。 */
function transitionColor(base: OKLCH, target: OKLCH, progress: number): OKLCH {
  const baseAngle = base.hue * Math.PI / 180
  const targetAngle = target.hue * Math.PI / 180
  const a = base.chroma * Math.cos(baseAngle) * (1 - progress) + target.chroma * Math.cos(targetAngle) * progress
  const b = base.chroma * Math.sin(baseAngle) * (1 - progress) + target.chroma * Math.sin(targetAngle) * progress
  return {
    lightness: base.lightness + (target.lightness - base.lightness) * progress,
    chroma: Math.hypot(a, b),
    hue: base.hue === target.hue || target.chroma === 0 ? base.hue : (Math.atan2(b, a) * 180 / Math.PI + 360) % 360,
  }
}

/** 近处减少环境牵引，远处增加；动态规则保留到求值时，仍读取材料自身当前色值。 */
function adjustEnvironmentSensitivities(color: ColorMaterial, environment: ColorEnvironment, level: number, progress: number): ColorEnvironmentSensitive {
  const sensitivities: ColorEnvironmentSensitive = {}

  /** 将原感知比例向不受影响或完全受影响的一端平滑推进。 */
  function adjust(response: number): number {
    return level < 0 ? response + (1 - response) * progress : response * (1 - progress)
  }

  for (const channel of ['lightness', 'chroma', 'hue'] as const) {
    const rule = color.environmentSensitivities?.[channel]
    sensitivities[channel] = typeof rule === 'function'
      ? (base, combined) => adjust(evaluateSensitivity(rule, base, combined))
      : adjust(evaluateSensitivity(rule, color.base, environment))
  }
  return sensitivities
}
