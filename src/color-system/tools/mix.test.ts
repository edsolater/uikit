/**
 * OKLCH 颜色材料混合的行为测试。
 *
 * 验证色环插值、Alpha、来源权重与后续环境响应。
 *
 * 防止混合结果色值正确，却丢失材料的动态规则。
 */

import { describe, expect, it } from 'vitest'
import { applyEnvironment, type ColorMaterial } from '../core'
import { hue } from './channels'
import { mix } from './mix'

/** 构造带环境感知比例的测试材料。 */
function material(hue: number, lightness = 0.6, chroma = 0.24): ColorMaterial {
  return { base: { lightness, chroma, hue }, environmentSensitivities: { lightness: 0.1, chroma: 0.2 }, purpose: 'content' }
}

describe('OKLCH 材料混合', () => {
  it('材料目标按来源权重和感知合成，缺少目标的来源仍响应环境', () => {
    const a: ColorMaterial = { ...material(30), environmentSensitivities: { lightness: 0.2 }, environmentTargets: { lightness: 0.8 } }
    const b: ColorMaterial = { ...material(90), environmentSensitivities: { lightness: 0.6 } }
    const mixed = mix(a, b)
    expect(applyEnvironment(mixed, { tint: { lightness: 0.1 } }).base.lightness).toBeCloseTo(0.47)
    const inactive: ColorMaterial = { ...a, environmentSensitivities: { lightness: 0 },
      environmentTargets: { lightness: () => { throw new Error('不响应的来源不应求目标') } } }
    expect(applyEnvironment(mix(inactive, b), { tint: { lightness: 0.1 } }).base.lightness).toBeCloseTo(0.45)
  })

  it('混合材料的目标函数在环境求值时读取当前混合色值', () => {
    const a: ColorMaterial = { ...material(30), environmentSensitivities: { lightness: 1 },
      environmentTargets: { lightness: (base, environment) => 1 - environment.tint!.lightness! * base.lightness } }
    const mixed = mix(a, a)
    const environment = { tint: { lightness: 0.2 } }
    const changed = applyEnvironment(mixed, environment)
    expect(changed.base.lightness).toBeCloseTo(0.88)
    expect(applyEnvironment(changed, environment).base.lightness).toBeCloseTo(0.824)
  })

  it('透明颜色的明度彩度按预乘 Alpha 混合，色相仍按原权重', () => {
    const a = { ...material(30, 0.4, 0.2), alpha: 0 }
    const b = material(90, 0.8, 0.1)
    const result = mix(a, b)
    expect(result.alpha).toBe(0.5)
    expect(result.base.lightness).toBeCloseTo(0.8)
    expect(result.base.chroma).toBeCloseTo(0.1)
    expect(result.base.hue).toBeCloseTo(60)
  })

  it('两种调用得到相同的 OKLCH 等权插值', () => {
    const colors = [material(30), material(90, 0.8, 0.15)]
    const result = mix(...colors)
    const configured = mix({ colors })
    expect(configured.base).toEqual(result.base)
    expect(result.base.lightness).toBeCloseTo(0.7)
    expect(result.base.chroma).toBeCloseTo(0.195)
    expect(result.base.hue).toBeCloseTo(60)
  })

  it('跨零点与不同方向沿正确色环路径混合', () => {
    const colors = [material(350), material(10)]
    expect(mix({ colors }).base.hue).toBeCloseTo(0)
    expect(mix({ colors, hue: 'longer' }).base.hue).toBeCloseTo(180)
    expect(mix({ colors, hue: 'increasing' }).base.hue).toBeCloseTo(0)
    expect(mix({ colors, hue: 'decreasing' }).base.hue).toBeCloseTo(180)
    expect(mix(material(0), material(180)).base.hue).toBeCloseTo(90)
  })

  it('无彩色借用有彩色的色相，不引入任意色相', () => {
    expect(mix(material(0, 1, 0), material(90)).base.hue).toBeCloseTo(90)
    expect(mix(material(90), material(250, 0, 0)).base.hue).toBeCloseTo(90)
  })

  it('多色累计权重，保留 CSS 的色相顺序差异', () => {
    const a = material(0, 0.2), b = material(100, 0.4), c = material(240, 0.8)
    expect(mix({ colors: [a, b, c], weights: [2, 3, 5] }).base.lightness).toBeCloseTo(0.56)
    expect(mix(a, b, c).base.hue).toBeCloseTo(353 + 1 / 3)
    expect(mix(b, c, a).base.hue).toBeCloseTo(113 + 1 / 3)
  })

  it('按权重合成环境响应，不改变输入', () => {
    const a = { ...material(30), environmentSensitivities: { lightness: 0.2, chroma: 0.4, hue: 0.1 } }
    const b = { ...material(90), environmentSensitivities: { lightness: 0.6, chroma: 0.8, hue: 0.3 } }
    const before = JSON.stringify([a, b])
    const result = mix({ colors: [a, b], weights: [3, 1] })
    const evaluated = applyEnvironment(result, { tint: { lightness: 0.2, chroma: 0.04, hue: 105 } })
    expect(evaluated.base.lightness).toBeCloseTo(0.48)
    expect(evaluated.base.chroma).toBeCloseTo(0.14)
    expect(evaluated.base.hue).toBeCloseTo(54)
    expect(result.purpose).toBe('content')
    expect(JSON.stringify([a, b])).toBe(before)
  })

  it('动态感知读取混合后的当前色值与环境，缺省规则按零参与', () => {
    const responsive: ColorMaterial = {
      ...material(30, 0.6, 0.1),
      environmentSensitivities: {
        chroma: base => base.hue / 360,
        lightness: (_base, environment) => environment.tint?.lightness ?? 0,
      },
    }
    const other: ColorMaterial = { base: { lightness: 0.6, chroma: 0.1, hue: 90 }, purpose: 'content' }
    const mixed = mix(responsive, other)
    const environment = { tint: { chroma: 0.2, lightness: 0.2 } }
    expect(applyEnvironment(mixed, environment).base.chroma).toBeCloseTo(0.1 + 0.1 / 12)
    expect(applyEnvironment(mixed, environment).base.lightness).toBeCloseTo(0.56)
    expect(applyEnvironment(mixed, { tint: { lightness: 0.8 } }).base.lightness).toBeCloseTo(0.68)
    expect(applyEnvironment(hue(mixed, 180), environment).base.chroma).toBeCloseTo(0.125)
  })

  it('忽略零权重，避免大权重溢出，并拒绝无法求值的权重', () => {
    const colors = [material(30), material(90)]
    expect(mix({ colors, weights: [0, 1] }).base).toEqual(colors[1].base)
    expect(mix({ colors, weights: [1e308, 1e308] }).base.hue).toBeCloseTo(60)
    expect(() => mix()).toThrow()
    expect(() => mix({ colors, weights: [0, 0] })).toThrow()
    expect(() => mix({ colors, weights: [-1, 1] })).toThrow()
    expect(() => mix({ colors, weights: [1] })).toThrow()
  })
})
