/** 用途颜色保存元素状态；普通函数产生内容与边界用途，根主题来源保持原地址。 */
import {
  token,
  type Token,
  type TokenInput,
  type TokenState,
} from '../../../../token'
import { oklch } from '../../functions/oklch'
import { add, multiply } from '../../functions/calc'
import {
  whenHover,
  whenActive,
  whenDisabled,
} from '../../../conditions/interaction'
import { colorMix } from '../../functions/color-mix'
import { readableContent } from './ui-color-structure'
import {
  themeBrand,
  themeAccent,
  themeGood,
  themeBad,
  themeWarn,
  themeInfo,
  themeCanvas,
  themeSurface,
  themeContent,
  themeBoundary,
  themeInk,
} from './seeds'

const soft = '&:where([data-emphasis="soft"])'
const strong = '&:where([data-emphasis="strong"])'
const softHover = `${whenHover.header}:where([data-emphasis="soft"])`
const strongHover = `${whenHover.header}:where([data-emphasis="strong"])`
const strongActive = `${whenActive.header}:where([data-emphasis="strong"])`
const softActive = `${whenActive.header}:where([data-emphasis="soft"])`

/** 品牌及反馈颜色只表达强调程度，交互反馈由动作颜色拥有。 */
export const colorBrand = token(themeBrand, {
  name: 'color-brand',
  state: {
    [soft]: (base) =>
      oklch(base, { alpha: (current) => multiply(current, 0.14) }),
    [strong]: (base) =>
      oklch(base, {
        lightness: (current) => add(current, 0.08),
        chroma: (current) => add(current, 0.02),
      }),
  },
})

/** 动作的交互与强调条件显式组合；禁用在所有可交互配方之后收束。 */
export const colorAction = token(themeBrand, {
  name: 'color-action',
  state: {
    ...colorBrand.state,
    [whenHover.header]: (base) =>
      oklch(base, {
        lightness: (current) => add(current, -0.04),
        chroma: (current) => add(current, 0.01),
      }),
    [softHover]: (base) =>
      oklch(base, {
        lightness: (current) => add(current, -0.04),
        alpha: (current) => multiply(current, 0.2),
      }),
    [strongHover]: (base) =>
      oklch(base, {
        lightness: (current) => add(current, 0.04),
        chroma: (current) => add(current, 0.03),
      }),
    [whenActive.header]: (base) =>
      oklch(base, {
        lightness: (current) => add(current, -0.08),
        chroma: (current) => add(current, -0.01),
      }),
    [softActive]: (base) =>
      oklch(base, {
        lightness: (current) => add(current, -0.08),
        alpha: (current) => multiply(current, 0.26),
      }),
    [strongActive]: (base) =>
      oklch(base, { chroma: (current) => add(current, 0.01) }),
    [whenDisabled.header]: (base) =>
      oklch(base, { alpha: (current) => multiply(current, 0.48) }),
  },
})
export const colorAccent = token(themeAccent, {
  name: 'color-accent',
  state: colorBrand.state,
  address: colorBrand.address,
})
export const colorGood = token(themeGood, {
  name: 'color-good',
  state: colorBrand.state,
  address: colorBrand.address,
})
export const colorBad = token(themeBad, {
  name: 'color-bad',
  state: colorBrand.state,
  address: colorBrand.address,
})
export const colorWarn = token(themeWarn, {
  name: 'color-warn',
  state: colorBrand.state,
  address: colorBrand.address,
})
export const colorInfo = token(themeInfo, {
  name: 'color-info',
  state: colorBrand.state,
  address: colorBrand.address,
})
export const colorLink = token(themeBrand, {
  name: 'color-link',
  state: {
    ...colorAction.state,
    '&:where(:visited):where(:not(:hover, :active, :disabled, [data-status~="disabled"]))':
      (base) =>
        oklch(base, {
          hue: (current) => add(current, 36),
          chroma: (current) => add(current, -0.02),
        }),
  },
})

/** 画布本身就是根主题来源；局部元素只需引用，不重定位其主题条件。 */
export const colorCanvas = themeCanvas

/** 中性区域的强调保留各自用途；主题仍由根来源负责。 */
export const colorSurface = token(themeSurface, {
  name: 'color-surface',
  state: {
    [soft]: (base) => colorMix([base, 0.5], [themeCanvas, 0.5]),
    [strong]: (base) => colorMix([base, 0.9], [themeInk, 0.1]),
  },
})
export const colorContent = token(themeContent, {
  name: 'color-content',
  state: {
    [soft]: (base) => colorMix([base, 0.7], [themeSurface, 0.3]),
    [strong]: (base) => colorMix([base, 0.4], [themeInk, 0.6]),
  },
})
export const colorBoundary = token(themeBoundary, {
  name: 'color-boundary',
  state: {
    [soft]: (base) =>
      oklch(base, { alpha: (current) => multiply(current, 0.5) }),
    [strong]: (base) =>
      oklch(base, { alpha: (current) => multiply(current, 1.6) }),
  },
})

/**
 * 内容用途基于自己的可读基础，明确替换已存在的强调与动作状态。
 */
export function colorRoleContent(base: Token<TokenInput> = colorAction) {
  const overrides: TokenState = {
    [soft]: (content) =>
      oklch(content, { alpha: (current) => multiply(current, 0.82) }),
    [strong]: (content) => content,
    [whenHover.header]: (content) => content,
    [softHover]: (content) =>
      oklch(content, { alpha: (current) => multiply(current, 0.9) }),
    [strongHover]: (content) => content,
    [whenActive.header]: (content) => content,
    [softActive]: (content) => content,
    [strongActive]: (content) => content,
  }
  return token(readableContent(base.default), {
    name: `${base.name ?? 'color'}-content`,
    address: base.address,
    state: Object.fromEntries(
      Object.entries(base.state ?? {}).map(([name, rule]) => [
        name,
        overrides[name] ?? rule,
      ]),
    ),
  })
}

/**
 * 边界用途在独立基础上组合透明度，不将用途记录塞进来源 Token。
 */
export function colorRoleBoundary(base: Token<TokenInput> = colorAction) {
  const overrides: TokenState = {
    [soft]: (boundary) =>
      oklch(boundary, { alpha: (current) => multiply(current, 0.22 / 0.44) }),
    [strong]: (boundary) =>
      oklch(boundary, { alpha: (current) => multiply(current, 0.64 / 0.44) }),
    [whenHover.header]: (boundary) =>
      oklch(boundary, { alpha: (current) => multiply(current, 0.56 / 0.44) }),
    [softHover]: (boundary) =>
      oklch(boundary, { alpha: (current) => multiply(current, 0.32 / 0.44) }),
    [strongHover]: (boundary) =>
      oklch(boundary, { alpha: (current) => multiply(current, 0.76 / 0.44) }),
    [whenActive.header]: (boundary) =>
      oklch(boundary, { alpha: (current) => multiply(current, 0.72 / 0.44) }),
    [softActive]: (boundary) =>
      oklch(boundary, { alpha: (current) => multiply(current, 0.4 / 0.44) }),
    [strongActive]: (boundary) =>
      oklch(boundary, { alpha: (current) => multiply(current, 0.88 / 0.44) }),
  }
  return token(
    oklch(base.default, { alpha: (current) => multiply(current, 0.44) }),
    {
      name: `${base.name ?? 'color'}-boundary`,
      address: base.address,
      state: Object.fromEntries(
        Object.entries(base.state ?? {}).map(([name, rule]) => [
          name,
          overrides[name] ?? rule,
        ]),
      ),
    },
  )
}
