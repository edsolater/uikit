/** 验证零级、褪色、动态感知与连续过渡；清晰程度由色阶图验收。 */
import { describe, expect, it } from 'vitest'
import { applyEnvironment, type ColorMaterial, type OKLCH } from '../core'
import { hue } from './channels'
import { emphasis } from './emphasis'

const color: ColorMaterial = { base: { lightness: 0.64, chroma: 0.14, hue: 145 }, alpha: 0.4, purpose: 'content' }
const environment = { tint: { lightness: 0.2, chroma: 0.02, hue: 250 } }

/** 在连续颜色坐标中检查路径，避免把无彩点或色相回绕误认成跳变。 */
function coordinates(value: OKLCH): number[] {
  const angle = value.hue * Math.PI / 180
  return [value.lightness, value.chroma * Math.cos(angle), value.chroma * Math.sin(angle)]
}

/** 测量自身与环境的颜色差，检查退后时是否逐渐融合。 */
function distance(value: OKLCH, target: OKLCH): number {
  const first = coordinates(value)
  const second = coordinates(target)
  return Math.hypot(...first.map((value, index) => value - second[index]))
}

describe('颜色强调', () => {
  it('负级逐渐融入亮暗环境，自身与环境的差异逐级减小', () => {
    for (const lightness of [0.16, 0.96]) {
      const tint = { lightness, chroma: 0.01, hue: 250 }
      const first = emphasis(color, { tint }, -1).base
      const second = emphasis(color, { tint }, -2).base
      expect(distance(first, tint)).toBeLessThan(distance(color.base, tint))
      expect(distance(second, tint)).toBeLessThan(distance(first, tint))
    }
  })

  it('零级保持基底色和环境响应，强调不改变透明度与用途', () => {
    const material = { ...color, environmentSensitivities: { lightness: 0.2 } }
    const unchanged = emphasis(material, environment, 0)
    expect(unchanged.base).toEqual(material.base)
    expect(applyEnvironment(unchanged, environment).base).toEqual(applyEnvironment(material, environment).base)
    for (const level of [-2, 2]) {
      const result = emphasis(material, environment, level)
      expect(result.alpha).toBe(0.4)
      expect(result.purpose).toBe('content')
    }
    expect(material.base).toEqual({ lightness: 0.64, chroma: 0.14, hue: 145 })
  })

  it('动态感知不提前冻结，正级减弱感知、负级增强感知', () => {
    const material: ColorMaterial = { ...color, environmentSensitivities: { chroma: base => base.hue / 360 } }
    const near = emphasis(material, environment, 1)
    const far = emphasis(material, environment, -1)
    const changed = hue(near, 180)
    const result = applyEnvironment(changed, { tint: { chroma: 0.02 } })
    const nearResponse = (result.base.chroma - changed.base.chroma) / (0.02 - changed.base.chroma)
    expect(nearResponse).toBeGreaterThan(0)
    expect(nearResponse).toBeLessThan(0.5)
    const distant = hue(far, 180)
    const farResult = applyEnvironment(distant, { tint: { chroma: 0.02 } })
    const farResponse = (farResult.base.chroma - distant.base.chroma) / (0.02 - distant.base.chroma)
    expect(farResponse).toBeGreaterThan(0.5)
    const anotherHue = hue(near, 90)
    const anotherResult = applyEnvironment(anotherHue, { tint: { chroma: 0.02 } })
    const anotherResponse = (anotherResult.base.chroma - anotherHue.base.chroma) / (0.02 - anotherHue.base.chroma)
    expect(anotherResponse).toBeLessThan(nearResponse)
  })

  it('穿过零级、无彩点与色相回绕时，颜色及变化率连续', () => {
    const step = 0.0001
    const cases = [
      { material: color, environment },
      { material: color, environment: { tint: { lightness: 0.2, chroma: 0.14, hue: 325 } } },
      { material: hue(color, 359), environment: { tint: { lightness: 0.9, chroma: 0.1, hue: 1 } } },
    ]
    for (const { material, environment } of cases) {
      for (let level = -4; level <= 4; level += 0.25) {
        const left = coordinates(emphasis(material, environment, level - step).base)
        const center = coordinates(emphasis(material, environment, level).base)
        const right = coordinates(emphasis(material, environment, level + step).base)
        for (let channel = 0; channel < 3; channel++) {
          expect(Math.abs(right[channel] - left[channel])).toBeLessThan(0.001)
          expect(Math.abs((right[channel] - center[channel]) / step - (center[channel] - left[channel]) / step)).toBeLessThan(0.001)
        }
      }
    }
  })
})
