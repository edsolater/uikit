/** 完整颜色修改规则的 CSS 内容入口。
 *
 * 构造具名通道规则，并将规则应用到来源表达式。
 *
 * 规则独立于具体颜色，可由普通 Variable 保存和复用。
 */
import { createJSSContent, isJSSContent } from '../../../content'
import type { Expression } from '../../../content'
import { value } from '../../../value'
import type { ValueInput } from '../../../value'

/** 通道可直接设置，或通过回调变换当前通道表达式。 */
export type ColorChannelModification = ValueInput | ((currentExpression: Expression) => Expression)

/** 一条规则可以同时修改多个通道；未指定通道保持来源值。 */
export interface ColorModification {
  lightness?: ColorChannelModification
  chroma?: ColorChannelModification
  hue?: ColorChannelModification
  alpha?: ColorChannelModification
}

/**
 * 构造独立完整规则；回调处理 l/c/h/alpha 表达式，不读取具体颜色。
 * @example
 * // 悬停时提高亮度并降低色度；整个规则可保存为一个 CSS 变量。
 * const hoverChange = variable(colorModification({
 *   lightness: currentExpression => add(currentExpression, 0.05),
 *   chroma: currentExpression => multiply(currentExpression, 0.8),
 * }), 'hover-change')
 * rules('.button', [declare(surfaceColor, baseColor), declare(hoverChange)])
 * rules(['.button', '&:hover'], [modify(surfaceColor, hoverChange)])
 * // 固定亮度和透明度，其余通道沿用每次应用时的来源。
 * const fixedChange = colorModification({ lightness: 0.6, alpha: 0.7 })
 */
export function colorModification(changes: ColorModification = {}): Expression {
  const fields: [keyof ColorModification, string][] = [
    ['lightness', 'l'], ['chroma', 'c'], ['hue', 'h'], ['alpha', 'alpha'],
  ]
  const channels = fields.map(([name, symbol]) => {
    const change = changes[name]
    return isJSSContent(change) ? change : typeof change === 'function' ? change(value(symbol)) : change ?? symbol
  })
  return createJSSContent(resolve => {
    const values = channels.map(resolve)
    return values.some(channel => channel === undefined) ? undefined
      : `${values[0]} ${values[1]} ${values[2]} / ${values[3]}`
  }, channels)
}

/** 将一条完整规则应用到前序颜色；规则也可以是保存规则的普通 Variable。 */
export function applyColorModification(currentExpression: Expression, modification: ValueInput): Expression {
  return createJSSContent(resolve => {
    const source = resolve(currentExpression)
    const change = resolve(modification)
    return source === undefined || change === undefined ? undefined : `oklch(from ${source} ${change})`
  }, [currentExpression, modification])
}
