/**
 * 颜色材料的环境求值测试。
 *
 * 验证通道响应、动态感知与无效比例的拒绝行为。
 *
 * 防止自身色值与环境目标混淆，或前一通道的求值污染后续响应。
 */
import { describe, expect, it, vi } from 'vitest'
import { applyEnvironment, type ColorMaterial } from './core'
import { hue } from './tools/channels'

const material: ColorMaterial = {
  base: { lightness: 0.6, chroma: 0.1, hue: 30 },
  purpose: 'content',
}

describe('材料环境感知', () => {
  it('明度目标属于材料，固定目标和动态目标仍按原感知比例参与', () => {
    const fixed: ColorMaterial = { ...material, environmentSensitivities: { lightness: 0.5 }, environmentTargets: { lightness: 0.8 } }
    expect(applyEnvironment(fixed, { tint: { lightness: 0 } }).base.lightness).toBeCloseTo(0.7)
    const dynamic: ColorMaterial = { ...material, environmentSensitivities: { lightness: 1 },
      environmentTargets: { lightness: (base, environment) => 1 - environment.tint!.lightness! * base.lightness } }
    const environment = { tint: { lightness: 0.2 } }
    const changed = applyEnvironment(dynamic, environment)
    expect(changed.base.lightness).toBeCloseTo(0.88)
    expect(applyEnvironment(changed, environment).base.lightness).toBeCloseTo(0.824)
    expect(dynamic.base.lightness).toBe(0.6)
  })

  it('缺少环境明度或明度感知为零时不求材料目标，活动目标拒绝非有限值', () => {
    const target = vi.fn(() => Infinity)
    const responsive: ColorMaterial = { ...material, environmentSensitivities: { lightness: 1 }, environmentTargets: { lightness: target } }
    expect(applyEnvironment(responsive, { tint: { hue: 90 } }).base).toEqual(material.base)
    expect(applyEnvironment({ ...responsive, environmentSensitivities: { lightness: 0 } }, { tint: { lightness: 0 } }).base).toEqual(material.base)
    expect(target).not.toHaveBeenCalled()
    expect(() => applyEnvironment(responsive, { tint: { lightness: 0 } })).toThrow(RangeError)
    expect(() => applyEnvironment({ ...responsive, environmentTargets: { lightness: NaN } }, { tint: { lightness: 0 } })).toThrow(RangeError)
  })

  it('本次多环境按权重作用，后续计算不沿用旧环境', () => {
    const responsive = { ...material, alpha: 0.4, environmentSensitivities: { lightness: 0.5 } }
    const result = applyEnvironment(responsive,
      { environment: { tint: { lightness: 0.2 } }, weight: 3 },
      { environment: { tint: { lightness: 0.8 } }, weight: 1 })
    expect(result.base.lightness).toBeCloseTo(0.475)
    expect(result.alpha).toBe(0.4)
    expect(result.purpose).toBe('content')
    expect(applyEnvironment(result).base).toEqual(result.base)
    expect(applyEnvironment(result, { tint: { lightness: 0.8 } }).base.lightness).toBeCloseTo(0.6375)
    expect(responsive.base.lightness).toBe(0.6)
  })

  it('再次应用相同或新环境，从当前色值计算，不沿用旧环境', () => {
    const responsive = { ...material, environmentSensitivities: { lightness: 0.5 } }
    const dark = { tint: { lightness: 0.2 } }
    const first = applyEnvironment(responsive, dark)
    expect(first.base.lightness).toBeCloseTo(0.4)
    expect(applyEnvironment(first, dark).base.lightness).toBeCloseTo(0.3)
    expect(applyEnvironment(first, { tint: { lightness: 0.8 } }).base.lightness).toBeCloseTo(0.6)
  })

  it('动态规则在再次应用时读取当前基色', () => {
    const responsive = { ...material, environmentSensitivities: { lightness: (base: Readonly<typeof material.base>) => base.lightness } }
    const first = applyEnvironment(responsive, { tint: { lightness: 0.2 } })
    expect(first.base.lightness).toBeCloseTo(0.36)
    expect(applyEnvironment(first, { tint: { lightness: 0.2 } }).base.lightness).toBeCloseTo(0.3024)
  })

  it('环境权重拒绝无效值，零权重不参与，大权重不溢出', () => {
    const responsive = { ...material, environmentSensitivities: { lightness: 1 } }
    const dark = { tint: { lightness: 0.2 } }, light = { tint: { lightness: 0.8 } }
    expect(applyEnvironment(responsive, { environment: dark, weight: 0 }, light).base.lightness).toBeCloseTo(0.8)
    expect(applyEnvironment(responsive, { environment: dark, weight: 1e308 }, { environment: light, weight: 1e308 }).base.lightness).toBeCloseTo(0.5)
    for (const weight of [-1, 0, NaN, Infinity]) expect(() => applyEnvironment(responsive, { environment: dark, weight })).toThrow(RangeError)
  })

  it('固定比例独立作用于各通道，省略通道不响应', () => {
    const environment = { tint: { lightness: 0.2, chroma: 0.02, hue: 90 } }
    const result = applyEnvironment({ ...material, environmentSensitivities: { lightness: 0.5, chroma: 0.2 } }, environment)
    expect(result.base.lightness).toBeCloseTo(0.4)
    expect(result.base.chroma).toBeCloseTo(0.084)
    expect(result.base.hue).toBe(30)
    expect(applyEnvironment(material, environment).base).toEqual(material.base)
  })

  it('彩度感知读取自身色相，处理后的 base 会改变响应', () => {
    const responsive: ColorMaterial = { ...material, environmentSensitivities: { chroma: base => base.hue / 360 } }
    const environment = { tint: { chroma: 0.2, hue: 250 } }
    expect(applyEnvironment(responsive, environment).base.chroma).toBeCloseTo(0.1 + 0.1 / 12)
    expect(applyEnvironment(hue(responsive, 90), environment).base.chroma).toBeCloseTo(0.125)
    expect(responsive.base.hue).toBe(30)
  })

  it('感知函数接收未被逐通道修改的自身 base 与合成环境', () => {
    const responsive: ColorMaterial = {
      ...material,
      environmentSensitivities: {
        lightness: (_base, environment) => environment.tint?.lightness ?? 0,
        chroma: base => base.lightness,
      },
    }
    const environment = { tint: { lightness: 0.8, chroma: 0.04 } }
    const result = applyEnvironment(responsive, { tint: { lightness: 0.2, chroma: 0.02 } }, environment)
    expect(result.base.lightness).toBeCloseTo(0.55)
    expect(result.base.chroma).toBeCloseTo(0.058)
  })

  it('固定值与函数结果都拒绝无效比例', () => {
    for (const response of [-0.1, 1.1, NaN, Infinity]) {
      expect(() => applyEnvironment({ ...material, environmentSensitivities: { lightness: response } }, { tint: { lightness: 0.2 } })).toThrow(RangeError)
      expect(() => applyEnvironment({ ...material, environmentSensitivities: { lightness: () => response } }, { tint: { lightness: 0.2 } })).toThrow(RangeError)
    }
  })
})
