/** 修改颜色的明度、彩度、色相与 Alpha，保留其他材料信息。 */
import type { ColorMaterial } from '../core'

/** 指定明度，或根据当前明度计算新值；不截断、不舍入。 */
export function lightness<T extends ColorMaterial>(color: T, value: number | ((current: number) => number)): T {
  const next = typeof value === 'function' ? value(color.base.lightness) : value
  if (!Number.isFinite(next)) throw new RangeError('明度必须是有限数值')
  return { ...color, base: { ...color.base, lightness: next } }
}

/** 指定彩度，或根据当前彩度计算新值；不截断、不舍入。 */
export function chroma<T extends ColorMaterial>(color: T, value: number | ((current: number) => number)): T {
  const next = typeof value === 'function' ? value(color.base.chroma) : value
  if (!Number.isFinite(next)) throw new RangeError('彩度必须是有限数值')
  return { ...color, base: { ...color.base, chroma: next } }
}

/** 指定色相，或根据当前色相计算新值；单位为度，保留返回值。 */
export function hue<T extends ColorMaterial>(color: T, value: number | ((current: number) => number)): T {
  const next = typeof value === 'function' ? value(color.base.hue) : value
  if (!Number.isFinite(next)) throw new RangeError('色相必须是有限数值')
  return { ...color, base: { ...color.base, hue: next } }
}

/** 指定 0～1 的 Alpha，或根据当前值计算；省略视为 1，设为 1 时移除属性。 */
export function alpha<T extends ColorMaterial>(color: T, value: number | ((current: number) => number)): Omit<T, 'alpha'> & { alpha?: number } {
  const next = typeof value === 'function' ? value(color.alpha ?? 1) : value
  if (!Number.isFinite(next) || next < 0 || next > 1) throw new RangeError('Alpha 必须在 0～1 之间')
  const { alpha: previous, ...material } = color
  return next === 1 ? material : { ...material, alpha: next }
}
