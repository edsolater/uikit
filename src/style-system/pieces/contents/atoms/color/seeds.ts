/** 根主题来源；用途和元素状态由消费这些来源的材料负责。 */
import { variable } from '../../../../variable'
import { oklch } from '../../functions/oklch'
import { add, multiply } from '../../functions/calc'
import { colorMix } from '../../functions/color-mix'
import { brandColor } from './brand-color'
import { goodColor, warnColor, infoColor } from './ui-info-color'

export const themeBrand = variable({ default: brandColor, '&[data-theme="dark"]': base => oklch(base, { lightness: current => add(current, 0.12), chroma: current => add(current, -0.02) }) }, 'theme-brand')
const brandFlavor = oklch(themeBrand, { lightness: 0.5, chroma: 0.018 })
export const themeGood = variable({ default: colorMix([goodColor, 0.94], [brandFlavor, 0.06]), '&[data-theme="dark"]': base => oklch(base, { lightness: current => add(current, 0.1), chroma: current => add(current, -0.02) }) }, 'theme-good')
export const themeBad = variable({ default: colorMix(['#c42b1c', 0.94], [brandFlavor, 0.06]), '&[data-theme="dark"]': base => oklch(base, { lightness: current => add(current, 0.17), chroma: current => add(current, -0.01), hue: current => add(current, -2.07) }) }, 'theme-bad')
export const themeWarn = variable({ default: colorMix([warnColor, 0.94], [brandFlavor, 0.06]), '&[data-theme="dark"]': base => oklch(base, { lightness: current => add(current, 0.06), chroma: current => add(current, -0.02) }) }, 'theme-warn')
export const themeInfo = variable({ default: colorMix([infoColor, 0.94], [brandFlavor, 0.06]), '&[data-theme="dark"]': base => oklch(base, { lightness: current => add(current, 0.1), chroma: current => add(current, -0.02) }) }, 'theme-info')
export const themeAccent = variable({
  default: oklch(themeBrand, { hue: current => add(current, -18), lightness: current => add(current, 0.04), chroma: current => add(current, 0.01) }),
  '&[data-theme="dark"]': base => oklch(base, { chroma: current => add(current, -0.01) }),
}, 'theme-accent')

export const themeCanvas = variable({ default: oklch({ lightness: 0.945, chroma: 0.006, hue: 260 }), '&[data-theme="dark"]': base => oklch(base, { lightness: current => add(current, -0.815), chroma: current => add(current, 0.004) }) }, 'theme-canvas')
export const themeSurface = variable({ default: oklch({ lightness: 0.98, chroma: 0.003, hue: 260 }), '&[data-theme="dark"]': base => oklch(base, { lightness: current => add(current, -0.81), chroma: current => add(current, 0.009) }) }, 'theme-surface')
export const themeContent = variable({ default: oklch({ lightness: 0.26, chroma: 0.005, hue: 260 }), '&[data-theme="dark"]': base => oklch(base, { lightness: current => add(current, 0.61), chroma: current => add(current, 0.001) }) }, 'theme-content')
export const themeBoundary = variable({ default: oklch({ lightness: 0.42, chroma: 0.006, hue: 260, alpha: 0.18 }), '&[data-theme="dark"]': base => oklch(base, { lightness: current => add(current, -0.11), chroma: current => add(current, 0.008), alpha: current => multiply(current, 1 / 0.18) }) }, 'theme-boundary')
export const themeInk = variable({ default: 'black', '&[data-theme="dark"]': 'white' }, 'theme-ink')
