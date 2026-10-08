/** OKLCH 通道变化描述及其 CSS 配方。
 *
 * 保存固定通道或回调，构造时不执行回调；onCompile 从当前 change 提供通道配方 Expression，文本在输出时生成。
 *
 * 让来源颜色与变化分别复用，供 modify 组合相对颜色、adjust 计算新的直接通道数据。
 */
import { createJSSContent, isJSSContent, type Expression, type JSSContent } from './content'
import { value, type ValueInput } from './value'
import type { Modification } from './modification'
import { isFunction } from '@edsolater/fnkit'

/** 固定通道内容，或将当前通道 Expression 变换为新 Expression 的回调。 */
export type ColorVariableChannelModification = ValueInput | ((currentExpression: Expression) => Expression)

/** 一条颜色变化的通道配置；未指定通道保持来源值。 */
export interface ColorVariableModification {
  lightness?: ColorVariableChannelModification
  chroma?: ColorVariableChannelModification
  hue?: ColorVariableChannelModification
  alpha?: ColorVariableChannelModification
}

/**
 * 保存 changes 的固定通道与回调，返回带通道内容编译能力的颜色 Modification；构造时不执行回调。
 * @example
 * const hoverChange = variable(colorVariableModification({
 *   lightness: currentExpression => add(currentExpression, 0.05),
 *   chroma: currentExpression => multiply(currentExpression, 0.8),
 * }), 'hover-change')
 * rules('.button', [declare(surfaceColor, baseColor), declare(hoverChange)])
 * rules(['.button', '&:hover'], [modify(surfaceColor, hoverChange)])
 */
export const colorVariableModification = (changes: ColorVariableModification = {}): Modification<ColorVariableModification> & Required<Pick<JSSContent, 'onCompile'>> => ({
  change: changes,
  /**
   * 用 l/c/h/alpha 表达式执行通道回调，通过 setContent 提供输出整条通道配方的 Expression。
   */
  onCompile(context, controller) {
    const changes = this.change
    const fields: [keyof ColorVariableModification, string][] = [
      ['lightness', 'l'], ['chroma', 'c'], ['hue', 'h'], ['alpha', 'alpha'],
    ]
    const channels = fields.map(([name, symbol]) => changes[name] === undefined ? symbol : applyColorChannel(changes[name], value(symbol)))
    controller.setContent(context, createJSSContent(resolve => {
      const values = channels.map(resolve)
      return values.some(channel => channel === undefined) ? undefined
        : `${values[0]} ${values[1]} ${values[2]} / ${values[3]}`
    }, channels))
  },
})

/**
 * 将固定通道或回调应用到当前表达式；可调用内容保持为内容。
 */
export const applyColorChannel = (change: ColorVariableChannelModification, currentExpression: Expression): ValueInput =>
  !isJSSContent(change) && isFunction(change) ? change(currentExpression) : change
