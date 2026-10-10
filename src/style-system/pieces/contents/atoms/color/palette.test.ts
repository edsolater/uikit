/** 色板材料的环境响应验证。
 *
 * 检查亮暗和彩度变化、色相身份、派生感知与输入保持。
 *
 * 防止材料缺少通道感知，或以环境强度掩盖颜色被完全染色的问题。
 */
import { expect, test } from 'vitest'
import { applyEnvironment, alpha, hue, emphasis } from '@/color-system'
import { paper, ink, neutral } from './palette'
import { brand, interactive, highlight } from './brand-color'
import { good, bad, warn, info } from './info-color'
import { lightTheme, darkTheme } from './theme'

test('红色在亮环境更亮、暗环境更深，蓝色环境不会把它变为蓝色', () => {
  const red = alpha(hue(brand, 30), 0.6)
  const original = structuredClone(red)
  const bright = applyEnvironment(red, lightTheme)
  const dark = applyEnvironment(red, darkTheme)

  expect(bright.base.lightness).toBeGreaterThan(red.base.lightness)
  expect(dark.base.lightness).toBeLessThan(red.base.lightness)
  expect(bright.base.hue).toBeGreaterThan(red.base.hue)
  expect(dark.base.hue).toBeLessThan(red.base.hue)
  for (const changed of [bright, dark]) {
    expect(changed.base.chroma).toBeLessThan(red.base.chroma)
    expect(changed.base.chroma).toBeGreaterThan(0)
    expect(changed.base.hue).toBeGreaterThan(20)
    expect(changed.base.hue).toBeLessThan(40)
    expect(changed.alpha).toBe(red.alpha)
    expect(changed.purpose).toBe(red.purpose)
  }
  expect(red).toEqual(original)
})

test('所有色板材料响应亮暗和彩度环境，保留自身色相附近的颜色', () => {
  for (const material of [paper, ink, neutral, brand, interactive, highlight, good, bad, warn, info]) {
    const original = { ...material, base: { ...material.base }, environmentSensitivities: { ...material.environmentSensitivities } }
    const bright = applyEnvironment(material, lightTheme)
    const dark = applyEnvironment(material, darkTheme)
    expect(bright.base.lightness).not.toBe(dark.base.lightness)
    for (const changed of [bright, dark]) {
      expect(changed.base.chroma).toBeLessThan(material.base.chroma)
      expect(changed.base.chroma).toBeGreaterThan(0)
      const distance = Math.abs(((changed.base.hue - material.base.hue + 540) % 360) - 180)
      expect(distance).toBeGreaterThan(0)
      expect(distance).toBeLessThanOrEqual(8)
      expect(changed.environmentSensitivities).toEqual(material.environmentSensitivities)
    }
    expect(material).toEqual(original)
  }
})

test('纸面在暗环境接近黑色深灰，墨色按背景方向改变以保持可辨识', () => {
  const brightPaper = applyEnvironment(paper, lightTheme)
  const darkPaper = applyEnvironment(paper, darkTheme)
  const brightInk = applyEnvironment(ink, lightTheme)
  const darkInk = applyEnvironment(ink, darkTheme)
  expect(brightPaper.base.lightness).toBeGreaterThan(0.95)
  expect(darkPaper.base.lightness).toBeGreaterThan(0.1)
  expect(darkPaper.base.lightness).toBeLessThan(0.25)
  expect(brightInk.base.lightness).toBeGreaterThan(0.25)
  expect(brightInk.base.lightness).toBeLessThan(0.4)
  expect(darkInk.base.lightness).toBeGreaterThan(0.8)
  expect(darkInk.base.lightness).toBeLessThan(0.95)
  expect(brightPaper.base.lightness - brightInk.base.lightness).toBeGreaterThan(0.5)
  expect(darkInk.base.lightness - darkPaper.base.lightness).toBeGreaterThan(0.5)
})

test('墨色负强调后继续应用暗环境时逐渐褪入背景，目标不保存旧环境', () => {
  const normal = applyEnvironment(ink, darkTheme)
  const far = emphasis(ink, darkTheme, -1)
  const farther = emphasis(ink, darkTheme, -2)
  const faded = applyEnvironment(far, darkTheme)
  const moreFaded = applyEnvironment(farther, darkTheme)
  expect(faded.base.lightness).toBeLessThan(normal.base.lightness)
  expect(moreFaded.base.lightness).toBeLessThan(faded.base.lightness)
  expect(applyEnvironment(emphasis(ink, darkTheme, -6), darkTheme).base.lightness).toBeLessThan(0.01)
  expect(applyEnvironment(far, lightTheme).base.lightness).toBeGreaterThan(applyEnvironment(ink, lightTheme).base.lightness)
  expect(applyEnvironment(emphasis(ink, darkTheme, 1), darkTheme).base.lightness).toBeGreaterThan(0.7)
  expect(emphasis(ink, darkTheme, 0)).toBe(ink)
  expect(applyEnvironment(alpha(ink, 0.4), darkTheme).base.lightness).toBeGreaterThan(0.8)
})

test('品牌派生保留材料感知，显式正常环境强度下仍保留红色色相', () => {
  expect(interactive).toBe(brand)
  expect(highlight.environmentSensitivities).toEqual(brand.environmentSensitivities)
  const red = hue(brand, 30)
  const changed = applyEnvironment(red, { tint: { hue: 210 }, influence: { hue: 1 } })
  expect(changed.base.hue).toBeGreaterThan(20)
  expect(changed.base.hue).toBeLessThan(40)
})
