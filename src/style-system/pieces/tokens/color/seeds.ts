/** 根主题来源；用途和元素状态由消费这些来源的材料负责。 */
import { whenDarkTheme } from '../../conditions/environment'
import { token, type Token } from '../../../token'
import { oklch, type OKLCHChanges } from '../../functions/oklch'
import { add, multiply } from '../../functions/calc'
import { colorMix } from '../../functions/color-mix'
import { brandColor } from './brand-color'
import { goodColor, badColor, warnColor, infoColor } from './ui-info-color'
import { paperColor } from './palette'

export const brandColorTheme = token(brandColor, {
  name: 'brand-color-theme',
  state: [
    [
      whenDarkTheme,
      (base) =>
        oklch(base, {
          lightness: (current) => add(current, 0.12),
          chroma: (current) => add(current, -0.02),
        }),
    ],
  ],
})
export const accentColorTheme = token(
  oklch(brandColorTheme, {
    hue: (current) => add(current, -18),
    lightness: (current) => add(current, 0.04),
    chroma: (current) => add(current, 0.01),
  }),
  {
    name: 'accent-color-theme',
    state: [
      [
        whenDarkTheme,
        (base) => oklch(base, { chroma: (current) => add(current, -0.01) }),
      ],
    ],
  },
)

/**
 * 反馈主题共用基础颜色与品牌气息的混合比例，暗色变化由各反馈颜色指定。
 */
function createFeedbackTheme(
  source: Token,
  name: string,
  darkChanges: OKLCHChanges,
): Token {
  return token(
    colorMix(
      [source, 0.94],
      [oklch(brandColorTheme, { lightness: 0.5, chroma: 0.018 }), 0.06],
    ),
    {
      name,
      state: [[whenDarkTheme, (base) => oklch(base, darkChanges)]],
    },
  )
}

export const goodColorTheme = createFeedbackTheme(
  goodColor,
  'good-color-theme',
  {
    lightness: (current) => add(current, 0.1),
    chroma: (current) => add(current, -0.02),
  },
)
export const badColorTheme = createFeedbackTheme(badColor, 'bad-color-theme', {
  lightness: (current) => add(current, 0.17),
  chroma: (current) => add(current, -0.01),
  hue: (current) => add(current, -2.07),
})
export const warnColorTheme = createFeedbackTheme(
  warnColor,
  'warn-color-theme',
  {
    lightness: (current) => add(current, 0.06),
    chroma: (current) => add(current, -0.02),
  },
)
export const infoColorTheme = createFeedbackTheme(
  infoColor,
  'info-color-theme',
  {
    lightness: (current) => add(current, 0.1),
    chroma: (current) => add(current, -0.02),
  },
)

export const canvasColorTheme = token(
  oklch({ lightness: 0.945, chroma: 0.006, hue: 260 }),
  {
    name: 'canvas-color-theme',
    state: [
      [
        whenDarkTheme,
        (base) =>
          oklch(base, {
            lightness: (current) => add(current, -0.815),
            chroma: (current) => add(current, 0.004),
          }),
      ],
    ],
  },
)
export const surfaceColorTheme = token(paperColor, {
  name: 'surface-color-theme',
  state: [
    [
      whenDarkTheme,
      (base) =>
        oklch(base, {
          lightness: (current) => add(current, -0.81),
          chroma: (current) => add(current, 0.009),
        }),
    ],
  ],
})
export const contentColorTheme = token(
  oklch({ lightness: 0.26, chroma: 0.005, hue: 260 }),
  {
    name: 'content-color-theme',
    state: [
      [
        whenDarkTheme,
        (base) =>
          oklch(base, {
            lightness: (current) => add(current, 0.61),
            chroma: (current) => add(current, 0.001),
          }),
      ],
    ],
  },
)
export const boundaryColorTheme = token(
  oklch({ lightness: 0.42, chroma: 0.006, hue: 260, alpha: 0.18 }),
  {
    name: 'boundary-color-theme',
    state: [
      [
        whenDarkTheme,
        (base) =>
          oklch(base, {
            lightness: (current) => add(current, -0.11),
            chroma: (current) => add(current, 0.008),
            alpha: (current) => multiply(current, 1 / 0.18),
          }),
      ],
    ],
  },
)
export const inkColorTheme = token('black', {
  name: 'ink-color-theme',
  state: [[whenDarkTheme, 'white']],
})
