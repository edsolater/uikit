/** 具名 OKLCH 通道的内容组织。
 *
 * 保留普通颜色的原始通道，或连接来源颜色与通道变化。
 *
 * 通道数据供 JS 调整，JSS 依赖供编译输出。
 */
import { isFunction, isObject } from '@edsolater/fnkit'
import { createJSSContent, isJSSContent, type Expression, type JSSContent } from '../../../content'
import { value, type ExpressionValue, type ValueInput } from '../../../value'

/** 普通 OKLCH 颜色通道；透明度省略时为完全不透明。 */
export interface OKLCHChannels {
  lightness: ValueInput
  chroma: ValueInput
  hue: ValueInput
  alpha?: ValueInput
}

/** 固定通道内容或根据当前通道表达式计算的变化。 */
export type OKLCHChannelChange = ValueInput | ((currentExpression: Expression) => Expression)

/** 相对颜色的通道变化；未指定的通道及透明度保留来源。 */
export interface OKLCHChanges {
  lightness?: OKLCHChannelChange
  chroma?: OKLCHChannelChange
  hue?: OKLCHChannelChange
  alpha?: OKLCHChannelChange
}

/**
 * 返回持有原始 channels 的 ExpressionValue，输出时解析通道内容并生成普通 OKLCH 颜色文本。
 * @example
 * // 创建明度为 0.6、透明度为 0.8 的蓝色，不创建 CSS Variable。
 * oklch({ lightness: 0.6, chroma: 0.12, hue: 250, alpha: 0.8 })
 * // 明度跟随样式变量，其余通道使用指定值。
 * oklch({ lightness: variable(0.6, 'surface-lightness'), chroma: 0.02, hue: 250 })
 */
export function oklch(channels: OKLCHChannels): ExpressionValue<OKLCHChannels>

/**
 * 根据来源当前颜色生成相对 Expression；固定通道设值，回调在编译消费时计算，省略通道保持来源。
 * 也接受完整通道内容，以便独立配方保留 CSS 引用与局部覆盖。
 * @example oklch(base, { lightness: current => add(current, -0.04) })
 */
export function oklch(source: ValueInput, changes: OKLCHChanges | ValueInput): Expression

/**
 * 按参数数量组织普通颜色或来源颜色的变化，不创建命名配方或 Variable。
 */
export function oklch(source: OKLCHChannels | ValueInput, changes?: OKLCHChanges | ValueInput): ExpressionValue<OKLCHChannels> | Expression {
  if (arguments.length === 2) {
    const channels: ValueInput = isObject(changes) && !isJSSContent(changes)
      ? { onCompile: (context, controller) => controller.setContent(context, oklchChannels(changes)) } satisfies JSSContent
      : changes
    return createJSSContent(resolve => {
      const color = resolve(source)
      const values = resolve(channels)
      return color === undefined || values === undefined ? undefined : `oklch(from ${color} ${values})`
    }, [source, channels])
  }
  return value(source as OKLCHChannels, { dependencies: current => Object.values(current), toCSSString: ({ lightness, chroma, hue, alpha }, resolve) => {
    const channels = [lightness, chroma, hue].map(resolve)
    const opacity = resolve(alpha)
    if (channels.some((channel) => channel === undefined) || (alpha !== undefined && opacity === undefined)) return undefined
    return `oklch(${channels.join(' ')}${opacity === undefined || opacity === '1' ? '' : ` / ${opacity}`})`
  } })
}

/**
 * 将通道变化转为源无关的 l/c/h/alpha 内容；可调用 JSS 内容保留身份，普通回调收到当前通道表达式。
 */
export function oklchChannels(changes: OKLCHChanges): Expression {
  const channels = Object.entries({ l: changes.lightness, c: changes.chroma, h: changes.hue, alpha: changes.alpha }).map(
    ([symbol, change]) =>
      change === undefined ? symbol : !isJSSContent(change) && isFunction(change) ? change(value(symbol)) : change,
  )
  return createJSSContent(resolve => {
    const values = channels.map(resolve)
    return values.some(channel => channel === undefined) ? undefined : `${values[0]} ${values[1]} ${values[2]} / ${values[3]}`
  }, channels)
}
