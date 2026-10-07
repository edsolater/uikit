/** 完整颜色规则的描述与颜色表达式应用。
 *
 * 构造具名通道规则，并将规则应用到来源表达式。
 *
 * 规则独立于具体颜色，可由普通 Variable 保存和复用。
 */
import { createJSSContent, isJSSContent } from '../../../content'
import type { Expression } from '../../../content'
import { value } from '../../../value'
import type { ValueInput } from '../../../value'
import { isModification, modificationRule, type Modification, type ModificationRule } from '../../../modification'
import type { Variable } from '../../../variable'
import { isFunction } from '@edsolater/fnkit'

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
 * 构造独立完整规则；应用时回调处理当前通道表达式，CSS 消费时使用 l/c/h/alpha。
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
export const colorModification = (changes: ColorModification = {}): Modification => ({ [modificationRule]: changes })

/** 消费方将固定通道或回调应用到当前表达式；可调用内容保持为内容。 */
export const applyColorChannel = (change: ColorChannelModification, currentExpression: Expression): ValueInput =>
  !isJSSContent(change) && isFunction(change) ? change(currentExpression) : change

/** Variable 消费完整颜色规则时构造单条通道内容，不输出具体颜色。 */
export function colorModificationContent(rule: ModificationRule): Expression {
  if (isFunction(rule)) throw new Error('表达式修改规则需要来源表达式，请通过 modify 应用。')
  const fields: [keyof ColorModification, string][] = [
    ['lightness', 'l'], ['chroma', 'c'], ['hue', 'h'], ['alpha', 'alpha'],
  ]
  const channels = fields.map(([name, symbol]) => rule[name] === undefined ? symbol : applyColorChannel(rule[name], value(symbol)))
  return createJSSContent(resolve => {
    const values = channels.map(resolve)
    return values.some(channel => channel === undefined) ? undefined
      : `${values[0]} ${values[1]} ${values[2]} / ${values[3]}`
  }, channels)
}

/** 将一条完整规则应用到前序颜色；规则也可以是保存规则的普通 Variable。 */
export const applyColorModification = (currentExpression: Expression, modification: Modification | Variable): Expression => ({
  onCompile(context, controller) {
    const content = isModification(modification) ? colorModificationContent(modification[modificationRule]) : modification
    controller.setContent(context, createJSSContent(resolve => {
      const source = resolve(currentExpression)
      const change = resolve(content)
      return source === undefined || change === undefined ? undefined : `oklch(from ${source} ${change})`
    }, [currentExpression, content]))
  },
})
