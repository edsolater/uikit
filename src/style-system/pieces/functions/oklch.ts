/**
 * 具名 OKLCH 通道的内容组织。
 *
 * 保留普通颜色的原始通道，或连接来源颜色与通道变化。
 *
 * 通道数据供 JS 调整，JSS 依赖供编译输出。
 */
import { isFunction, isObject, isString } from '@edsolater/fnkit'
import { createJSSContent, isJSSContent, type Expression } from '../../content'
import {
  token,
  type Token,
  type TokenInput,
  type TokenOptions,
} from '../../token/core'

/** 普通 OKLCH 颜色通道；透明度省略时为完全不透明。 */
export interface OKLCHChannels {
  lightness: TokenInput
  chroma: TokenInput
  hue: TokenInput
  alpha?: TokenInput
}

/** 固定通道内容或根据当前通道表达式计算的变化。 */
export type OKLCHChannelChange =
  TokenInput | ((currentExpression: Expression) => TokenInput)

/** 相对颜色的通道变化；未指定的通道及透明度保留来源。 */
export interface OKLCHChanges {
  lightness?: OKLCHChannelChange
  chroma?: OKLCHChannelChange
  hue?: OKLCHChannelChange
  alpha?: OKLCHChannelChange
}

/** 来源颜色及 OKLCH 通道；数值设值，回调根据当前通道计算。 */
export interface ColorDescription extends OKLCHChanges {
  base: TokenInput
}

type RelativeColorInput =
  ColorDescription | [TokenInput, OKLCHChanges | TokenInput]

/**
 * 从来源描述创建相对 OKLCH 颜色 Token，省略的通道保留来源值。
 *
 * 带 `base` 的对象是来源描述；不带 `base` 的普通通道对象直接定义新颜色。
 * 通道数值或 Token 表示设值，回调表示根据来源通道计算；`current` 是 CSS 表达式，
 * 应使用 `add`、`multiply` 等工具组合，不能当作 JS 数字直接运算。
 * 回调在编译消费时执行；来源和通道中的 Token 参与依赖解析，CSS 变量引用继续响应局部覆盖。
 *
 * 本形式的第二项是 `token` 配置，可传名称字符串或配置对象。
 * 调用只返回 Token，实际颜色声明由 `rules` 等消费者生成。
 *
 * @example 只设置透明度，保留来源的明度、彩度和色相
 * ```ts
 * import { oklch } from '@edsolater/uikit/style-system'
 *
 * const background = oklch({ base: 'royalblue', alpha: 0.14 })
 * ```
 *
 * @example 设值与相对变化：来源透明度为 0.5 时，结果透明度分别为 0.14 和 0.07
 * ```ts
 * import { oklch, multiply } from '@edsolater/uikit/style-system'
 *
 * const base = 'oklch(0.6 0.12 250 / 0.5)'
 * const fixed = oklch({ base, alpha: 0.14 })
 * const relative = oklch({ base, alpha: (current) => multiply(current, 0.14) })
 * ```
 *
 * @example 同时使用来源 Token、固定值、通道 Token 和回调
 * ```ts
 * import { oklch, token, brandColor, add } from '@edsolater/uikit/style-system'
 *
 * const opacity = token(0.8, 'swatch-opacity')
 * const softened = oklch({
 *   base: brandColor,
 *   lightness: (current) => add(current, 0.04),
 *   chroma: 0.08,
 *   alpha: opacity,
 * })
 * // 色相未指定，仍跟随 brandColor；透明度跟随 opacity 的 CSS 值。
 * ```
 *
 * @example 配置名称、作用位置和状态；名称字符串是第二项的简写
 * ```ts
 * import { oklch, brandColor } from '@edsolater/uikit/style-system'
 *
 * const named = oklch({ base: brandColor, alpha: 0.4 }, 'swatch-color')
 * const interactive = oklch({ base: brandColor, alpha: 0.8 }, {
 *   name: 'interactive-color',
 *   address: '.Swatch',
 *   state: { hover: 'tomato', disabled: 'gray' },
 * })
 * ```
 *
 * @example 将颜色 Token 用于着色声明，也可以继续参与混色
 * ```ts
 * import { oklch, colorMix, rules, paint } from '@edsolater/uikit/style-system'
 *
 * const tint = oklch({ base: 'royalblue', alpha: 0.4 })
 * const background = colorMix({ color: tint, weight: 0.18 }, 'white')
 * rules('.Swatch', paint({ background, content: 'black' }))
 * ```
 */
export function oklch(
  description: ColorDescription,
  options?: string | TokenOptions<ColorDescription>,
): Token<ColorDescription>

/**
 * 用完整通道创建普通 OKLCH 颜色 Token，无需提供来源颜色。
 *
 * 明度、彩度和色相必填，透明度省略时为 1。通道接受直接值或 Token，
 * 此形式没有来源通道，因此不接收相对调整回调，也没有第二项配置参数。
 *
 * @example 定义新颜色；省略透明度时完全不透明，也可以显式设置透明度
 * ```ts
 * import { oklch } from '@edsolater/uikit/style-system'
 *
 * const solid = oklch({ lightness: 0.6, chroma: 0.12, hue: 250 })
 * const translucent = oklch({ lightness: 0.6, chroma: 0.12, hue: 250, alpha: 0.8 })
 * ```
 *
 * @example 普通通道也可以混用固定值和 Token
 * ```ts
 * import { oklch, token } from '@edsolater/uikit/style-system'
 *
 * const lightness = token(0.6, 'swatch-lightness')
 * const background = oklch({ lightness, chroma: 0.02, hue: 250 })
 * // background 的明度保留对 swatch-lightness 的引用。
 * ```
 */
export function oklch(channels: OKLCHChannels): Token<OKLCHChannels>

/**
 * 用「来源、通道变化」两个参数创建相对 OKLCH 颜色 Token。
 *
 * 来源可以是颜色字符串、Token 或延迟提供颜色的函数；通道变化可混用设值和回调，
 * 省略的通道保留来源值。与来源描述形式不同，这里的第二项是通道内容，不是 Token 配置。
 * 也可直接传完整的 `l c h / alpha` 通道文本或输出这份内容的 Token。
 * 来源或显式提供的通道内容未解析时，不输出不完整颜色。
 *
 * @example 字符串来源与通道设值；空对象表示保持全部来源通道
 * ```ts
 * import { oklch } from '@edsolater/uikit/style-system'
 *
 * const translucent = oklch('royalblue', { alpha: 0.6 })
 * const unchanged = oklch('royalblue', {})
 * ```
 *
 * @example Token 来源与相对回调，也支持在编译时读取来源函数
 * ```ts
 * import { oklch, brandColor, add, multiply } from '@edsolater/uikit/style-system'
 *
 * const pressed = oklch(brandColor, {
 *   lightness: (current) => add(current, -0.08),
 *   alpha: (current) => multiply(current, 0.8),
 * })
 * let selected = 'royalblue'
 * const selection = oklch(() => selected, { alpha: 0.6 })
 * selected = 'tomato' // 下次编译消费 selection 时使用 tomato。
 * ```
 *
 * @example 完整通道文本与通道 Token；第二项不是另一份颜色
 * ```ts
 * import { oklch, oklchChannels, brandColor, add } from '@edsolater/uikit/style-system'
 *
 * const brighter = oklch(brandColor, 'calc(l + 0.04) c h / alpha')
 * const channels = oklchChannels({
 *   lightness: (current) => add(current, 0.04),
 *   alpha: 0.8,
 * })
 * const translucent = oklch(brandColor, channels)
 * ```
 */
export function oklch(
  source: TokenInput,
  changes: OKLCHChanges | TokenInput,
): Token

/**
 * 按来源描述或参数形式创建普通与相对颜色 Token。
 */
export function oklch(
  source: OKLCHChannels | ColorDescription | TokenInput,
  changes?: OKLCHChanges | TokenInput | TokenOptions<ColorDescription>,
): Token {
  const description =
    isObject(source) && !isJSSContent(source) && 'base' in source
  if (description || arguments.length === 2) {
    const input: RelativeColorInput = description
      ? source
      : [source as TokenInput, changes as OKLCHChanges | TokenInput]
    const options = description
      ? (changes as string | TokenOptions<RelativeColorInput>)
      : undefined
    const result = token(input, {
      dependencies: (current) => [
        Array.isArray(current) ? current[0] : current.base,
        readChannels(current),
      ],
      toCSSString: (current, resolve) => {
        const base = resolve(Array.isArray(current) ? current[0] : current.base)
        const channels = resolve(readChannels(current))
        return base === undefined || channels === undefined
          ? undefined
          : `oklch(from ${base} ${channels})`
      },
      ...(isString(options) ? { name: options } : options),
    })
    return result

    function readChannels(current: RelativeColorInput): TokenInput {
      const value = Array.isArray(current) ? current[1] : current
      return isObject(value) && !isJSSContent(value) ? produceChannels : value
    }

    function produceChannels(): Expression {
      const current = result.default
      return prepareChannels(
        (Array.isArray(current) ? current[1] : current) as OKLCHChanges,
      )
    }
  }
  return token(source as OKLCHChannels, {
    dependencies: (current) => Object.values(current),
    toCSSString: ({ lightness, chroma, hue, alpha }, resolve) => {
      const channels = [lightness, chroma, hue].map(resolve)
      const opacity = resolve(alpha)
      if (
        channels.some((channel) => channel === undefined) ||
        (alpha !== undefined && opacity === undefined)
      )
        return undefined
      return `oklch(${channels.join(' ')}${opacity === undefined || opacity === '1' ? '' : ` / ${opacity}`})`
    },
  })
}

/**
 * 将通道变化转为源无关的 l/c/h/alpha 内容。
 * 可调用 JSS 内容保留身份，普通回调收到当前通道表达式。
 */
export function oklchChannels(changes: OKLCHChanges): Token {
  return token(() => prepareChannels(changes))
}

/** 当前通道回调与输出共享一份依赖，内容对象不作为回调执行。 */
function prepareChannels(changes: OKLCHChanges): Expression {
  const inputs = Object.entries({
    l: changes.lightness,
    c: changes.chroma,
    h: changes.hue,
    alpha: changes.alpha,
  }).map(([symbol, change]) =>
    change === undefined
      ? symbol
      : !isJSSContent(change) && isFunction(change)
        ? change(createJSSContent(() => symbol))
        : change,
  )
  return createJSSContent((resolve) => {
    const values = inputs.map(resolve)
    return values.some((channel) => channel === undefined)
      ? undefined
      : `${values[0]} ${values[1]} ${values[2]} / ${values[3]}`
  }, inputs)
}
