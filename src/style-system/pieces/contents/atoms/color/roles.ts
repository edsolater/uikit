/** 用途颜色保存元素状态，variants 选择部分；根主题来源保持原地址。 */
import { variable, variableFrom } from '../../../../variable'
import { oklch } from '../../functions/oklch'
import { add, multiply } from '../../functions/calc'
import { whenHover, whenActive, whenDisabled } from '../../../conditions/interaction'
import { colorMix } from '../../functions/color-mix'
import { readableContent } from './ui-color-structure'
import { themeBrand, themeAccent, themeGood, themeBad, themeWarn, themeInfo, themeCanvas, themeSurface, themeContent, themeBoundary, themeInk } from './seeds'

const soft = '&:where([data-emphasis="soft"])'
const strong = '&:where([data-emphasis="strong"])'
const softHover = `${whenHover.header}:where([data-emphasis="soft"])`
const strongHover = `${whenHover.header}:where([data-emphasis="strong"])`
const strongActive = `${whenActive.header}:where([data-emphasis="strong"])`
const softActive = `${whenActive.header}:where([data-emphasis="soft"])`

/** 品牌及反馈颜色只表达强调程度，交互反馈由动作颜色拥有。 */
export const colorBrand = variable(themeBrand, {
  name: 'color-brand',
  states: {
    [soft]: base => oklch(base, { alpha: current => multiply(current, 0.14) }),
    [strong]: base => oklch(base, { lightness: current => add(current, 0.08), chroma: current => add(current, 0.02) }),
  },
  variants: {
    surface: base => base,
    content: base => ({
      default: readableContent(base),
      [soft]: content => oklch(content, { alpha: current => multiply(current, 0.82) }),
      [strong]: content => content,
    }),
    boundary: base => ({
      default: oklch(base, { alpha: current => multiply(current, 0.44) }),
      [soft]: boundary => oklch(boundary, { alpha: current => multiply(current, 0.22 / 0.44) }),
      [strong]: boundary => oklch(boundary, { alpha: current => multiply(current, 0.64 / 0.44) }),
    }),
  },
})

/** 动作的交互与强调条件显式组合；禁用在所有可交互配方之后收束。 */
export const colorAction = variableFrom(colorBrand, themeBrand, {
  name: 'color-action',
  states: {
    [whenHover.header]: base => oklch(base, { lightness: current => add(current, -0.04), chroma: current => add(current, 0.01) }),
    [softHover]: base => oklch(base, { lightness: current => add(current, -0.04), alpha: current => multiply(current, 0.2) }),
    [strongHover]: base => oklch(base, { lightness: current => add(current, 0.04), chroma: current => add(current, 0.03) }),
    [whenActive.header]: base => oklch(base, { lightness: current => add(current, -0.08), chroma: current => add(current, -0.01) }),
    [softActive]: base => oklch(base, { lightness: current => add(current, -0.08), alpha: current => multiply(current, 0.26) }),
    [strongActive]: base => oklch(base, { chroma: current => add(current, 0.01) }),
    [whenDisabled.header]: base => oklch(base, { alpha: current => multiply(current, 0.48) }),
  },
  variants: {
    content: base => ({
      default: readableContent(base),
      [soft]: content => oklch(content, { alpha: current => multiply(current, 0.82) }),
      [strong]: content => content,
      [whenHover.header]: content => content,
      [softHover]: content => oklch(content, { alpha: current => multiply(current, 0.9) }),
      [strongHover]: content => content,
      [whenActive.header]: content => content,
      [softActive]: content => content,
      [strongActive]: content => content,
    }),
    boundary: base => ({
      default: oklch(base, { alpha: current => multiply(current, 0.44) }),
      [soft]: boundary => oklch(boundary, { alpha: current => multiply(current, 0.22 / 0.44) }),
      [strong]: boundary => oklch(boundary, { alpha: current => multiply(current, 0.64 / 0.44) }),
      [whenHover.header]: boundary => oklch(boundary, { alpha: current => multiply(current, 0.56 / 0.44) }),
      [softHover]: boundary => oklch(boundary, { alpha: current => multiply(current, 0.32 / 0.44) }),
      [strongHover]: boundary => oklch(boundary, { alpha: current => multiply(current, 0.76 / 0.44) }),
      [whenActive.header]: boundary => oklch(boundary, { alpha: current => multiply(current, 0.72 / 0.44) }),
      [softActive]: boundary => oklch(boundary, { alpha: current => multiply(current, 0.4 / 0.44) }),
      [strongActive]: boundary => oklch(boundary, { alpha: current => multiply(current, 0.88 / 0.44) }),
    }),
  },
})
export const colorAccent = variableFrom(colorBrand, themeAccent, 'color-accent')
export const colorGood = variableFrom(colorBrand, themeGood, 'color-good')
export const colorBad = variableFrom(colorBrand, themeBad, 'color-bad')
export const colorWarn = variableFrom(colorBrand, themeWarn, 'color-warn')
export const colorInfo = variableFrom(colorBrand, themeInfo, 'color-info')
export const colorLink = variableFrom(colorAction, themeBrand, {
  name: 'color-link',
  states: { '&:where(:visited):where(:not(:hover, :active, :disabled, [data-status~="disabled"]))': base => oklch(base, { hue: current => add(current, 36), chroma: current => add(current, -0.02) }) },
})

/** 画布本身就是根主题来源；局部元素只需引用，不重定位其主题条件。 */
export const colorCanvas = themeCanvas

/** 中性区域的强调保留各自用途；主题仍由根来源负责。 */
export const colorSurface = variable(themeSurface, {
  name: 'color-surface',
  states: {
    [soft]: base => colorMix([base, 0.5], [themeCanvas, 0.5]),
    [strong]: base => colorMix([base, 0.9], [themeInk, 0.1]),
  },
})
export const colorContent = variable(themeContent, {
  name: 'color-content',
  states: {
    [soft]: base => colorMix([base, 0.7], [themeSurface, 0.3]),
    [strong]: base => colorMix([base, 0.4], [themeInk, 0.6]),
  },
})
export const colorBoundary = variable(themeBoundary, {
  name: 'color-boundary',
  states: {
    [soft]: base => oklch(base, { alpha: current => multiply(current, 0.5) }),
    [strong]: base => oklch(base, { alpha: current => multiply(current, 1.6) }),
  },
})
