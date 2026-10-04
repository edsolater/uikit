/**
 * 颜色通道处理的行为测试。
 *
 * 验证绝对值设置、更新函数及其他材料信息的保留。
 *
 * 防止局部通道处理破坏后续环境响应或原材料。
 */
import { describe, expect, it } from 'vitest'
import { applyEnvironment, type ColorMaterial } from '../core'
import { alpha, chroma, hue, lightness } from './channels'

const color: ColorMaterial = {
  base: { lightness: 0.6, chroma: 0.1, hue: 350 },
  environmentSensitivities: { lightness: 0.2, chroma: 0.1 },
  purpose: 'content',
}

describe('颜色通道', () => {
  it('通道支持绝对值与更新函数，不改变未指定通道或原材料', () => {
    expect(lightness(color, 0.8).base).toEqual({ lightness: 0.8, chroma: 0.1, hue: 350 })
    expect(chroma(color, current => current * 2).base).toEqual({ lightness: 0.6, chroma: 0.2, hue: 350 })
    expect(hue(color, current => current + 20).base).toEqual({ lightness: 0.6, chroma: 0.1, hue: 370 })
    expect(lightness(color, current => current + 0.1).base.lightness).toBeCloseTo(0.7)
    expect(chroma(color, 0.04).base.chroma).toBe(0.04)
    expect(hue(color, 30).base.hue).toBe(30)
    expect(color.base).toEqual({ lightness: 0.6, chroma: 0.1, hue: 350 })
  })

  it('修改通道后保留已有环境响应、Alpha 与用途', () => {
    const original: ColorMaterial = {
      ...color,
      alpha: 0.4,
    }
    const changed = lightness(original, 0.8)
    const environment = { tint: { lightness: 0.2, chroma: 0.02 } }
    const result = applyEnvironment(changed, environment)
    expect(result.base.lightness).toBeCloseTo(0.68)
    expect(result.base.chroma).toBeCloseTo(0.092)
    expect(result.alpha).toBe(0.4)
    expect(changed.purpose).toBe('content')
    expect(applyEnvironment(original, environment).base.lightness).toBeCloseTo(0.52)
  })

  it('Alpha 不改变自身颜色，默认完全不透明，设为 1 后恢复不透明', () => {
    const transparent = alpha(color, current => current / 2)
    expect(transparent.alpha).toBe(0.5)
    expect(transparent.base).toEqual(color.base)
    const opaque = alpha(transparent, 1)
    expect(alpha(opaque, current => current / 2).alpha).toBe(0.5)
    expect(alpha(color, 0).alpha).toBe(0)
    expect(() => alpha(color, -0.1)).toThrow(RangeError)
    expect(() => alpha(color, 1.1)).toThrow(RangeError)
  })
})
