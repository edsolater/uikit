/** 根主题来源；用途和元素状态由消费这些来源的材料负责。 */
import { variable, type Variable } from '../../../../variable'
import { oklch, type OKLCHChanges } from '../../functions/oklch'
import { add, multiply } from '../../functions/calc'
import { colorMix } from '../../functions/color-mix'
import { brandColor } from './brand-color'
import { goodColor, badColor, warnColor, infoColor } from './ui-info-color'
import { paperColor } from './palette'

export const themeBrand = variable({ default: brandColor, '&[data-theme="dark"]': base => oklch(base, { lightness: current => add(current, 0.12), chroma: current => add(current, -0.02) }) }, 'theme-brand')
export const themeAccent = variable({
  default: oklch(themeBrand, { hue: current => add(current, -18), lightness: current => add(current, 0.04), chroma: current => add(current, 0.01) }),
  '&[data-theme="dark"]': base => oklch(base, { chroma: current => add(current, -0.01) }),
}, 'theme-accent')

/**
 * 反馈主题共用基础颜色与品牌气息的混合比例，暗色变化由各反馈颜色指定。
 */
function createFeedbackTheme(source: Variable, name: string, darkChanges: OKLCHChanges): Variable {
  return variable({
    default: colorMix([source, 0.94], [oklch(themeBrand, { lightness: 0.5, chroma: 0.018 }), 0.06]),
    '&[data-theme="dark"]': base => oklch(base, darkChanges),
  }, name)
}

export const themeGood = createFeedbackTheme(goodColor, 'theme-good', { lightness: current => add(current, 0.1), chroma: current => add(current, -0.02) })
export const themeBad = createFeedbackTheme(badColor, 'theme-bad', { lightness: current => add(current, 0.17), chroma: current => add(current, -0.01), hue: current => add(current, -2.07) })
export const themeWarn = createFeedbackTheme(warnColor, 'theme-warn', { lightness: current => add(current, 0.06), chroma: current => add(current, -0.02) })
export const themeInfo = createFeedbackTheme(infoColor, 'theme-info', { lightness: current => add(current, 0.1), chroma: current => add(current, -0.02) })

export const themeCanvas = variable({ default: oklch({ lightness: 0.945, chroma: 0.006, hue: 260 }), '&[data-theme="dark"]': base => oklch(base, { lightness: current => add(current, -0.815), chroma: current => add(current, 0.004) }) }, 'theme-canvas')
export const themeSurface = variable({ default: paperColor, '&[data-theme="dark"]': base => oklch(base, { lightness: current => add(current, -0.81), chroma: current => add(current, 0.009) }) }, 'theme-surface')
export const themeContent = variable({ default: oklch({ lightness: 0.26, chroma: 0.005, hue: 260 }), '&[data-theme="dark"]': base => oklch(base, { lightness: current => add(current, 0.61), chroma: current => add(current, 0.001) }) }, 'theme-content')
export const themeBoundary = variable({ default: oklch({ lightness: 0.42, chroma: 0.006, hue: 260, alpha: 0.18 }), '&[data-theme="dark"]': base => oklch(base, { lightness: current => add(current, -0.11), chroma: current => add(current, 0.008), alpha: current => multiply(current, 1 / 0.18) }) }, 'theme-boundary')
export const themeInk = variable({ default: 'black', '&[data-theme="dark"]': 'white' }, 'theme-ink')
