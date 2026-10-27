/**
 * 具名 OKLCH 通道的内容组织。
 *
 * 保留普通颜色的原始通道，或连接来源颜色与通道变化。
 *
 * 通道数据供 JS 调整，JSS 依赖供编译输出。
 */
import { isFunction, isObject } from '@edsolater/fnkit'
import {
  createJSSContent,
  isJSSContent,
  type Expression,
} from '../../content'
import { token, type Token, type TokenInput } from '../../token/core'

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

/**
 * 返回持有原始 channels 的 Token，输出时解析通道内容并生成普通 OKLCH 颜色文本。
 * @example
 * // 创建明度为 0.6、透明度为 0.8 的蓝色，不创建 CSS Token。
 * oklch({ lightness: 0.6, chroma: 0.12, hue: 250, alpha: 0.8 })
 * // 明度跟随样式变量，其余通道使用指定值。
 * oklch({ lightness: token(0.6, 'surface-lightness'), chroma: 0.02, hue: 250 })
 */
export function oklch(channels: OKLCHChannels): Token<OKLCHChannels>

/**
 * 根据来源当前颜色生成相对颜色 Token。
 * 固定通道设值，回调在编译消费时计算，省略通道保持来源。
 * 也接受完整通道内容，以便独立配方保留 CSS 引用与局部覆盖。
 * @example oklch(base, { lightness: current => add(current, -0.04) })
 */
export function oklch(
  source: TokenInput,
  changes: OKLCHChanges | TokenInput,
): Token

/**
 * 按参数数量创建普通颜色或相对颜色 Token，不附加命名配方。
 */
export function oklch(
  source: OKLCHChannels | TokenInput,
  changes?: OKLCHChanges | TokenInput,
): Token {
  if (arguments.length === 2) {
    const channels: TokenInput =
      isObject(changes) && !isJSSContent(changes)
        ? oklchChannels(changes as OKLCHChanges)
        : changes
    return token(
      { default: [source, channels] },
      {
        toCSSString: (current, resolve) => {
          const color = resolve(current[0])
          const values = resolve(current[1])
          return color === undefined || values === undefined
            ? undefined
            : `oklch(from ${color} ${values})`
        },
      },
    )
  }
  return token(
    { default: source as OKLCHChannels },
    {
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
    },
  )
}

/**
 * 将通道变化转为源无关的 l/c/h/alpha 内容。
 * 可调用 JSS 内容保留身份，普通回调收到当前通道表达式。
 */
export function oklchChannels(changes: OKLCHChanges): Token {
  return token(produceChannels)

  /**
   * 在消费位置读取当前字段，通道回调仍收到对应符号表达式。
   */
  function produceChannels(): Token {
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
    return token(
      { default: inputs },
      {
        toCSSString: (current, resolve) => {
          const values = current.map(resolve)
          return values.some((channel) => channel === undefined)
            ? undefined
            : `${values[0]} ${values[1]} ${values[2]} / ${values[3]}`
        },
      },
    )
  }
}
