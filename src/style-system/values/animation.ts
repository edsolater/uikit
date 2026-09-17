/** 动画名称与动画复合值保留依赖；名称被访问时才挂载帧定义。 */
import { condition } from '../core/css-condition'
import type { Rules } from '../core/css-rule'
import { value, type Value, type ValueInput } from '../core/css-value'

/**
 * 创建带帧定义依赖的动画名称 Value；它被编译访问时才把 @keyframes 提供给本次编译，不写源账本。
 * @example
 * const frames: Rules = new Map([[[[condition('to')], 'opacity'], 0]])
 * animationName('fade', frames) // 值文本为 fade，并生成 @keyframes fade { to { opacity: 0; } }。
 */
export function animationName(name: string, frames: Rules): Value {
  return value(name, { onActive: () => new Map([[[[condition(`@keyframes ${name}`)], undefined], frames]]) })
}

/** CSS animation 复合值的各项组成；名称与时长必填，其余字段缺省时不输出对应片段。 */
export interface AnimationParts {
  name: ValueInput
  duration: ValueInput
  easing?: ValueInput
  delay?: ValueInput
  iterations?: ValueInput
  direction?: ValueInput
  fillMode?: ValueInput
  playState?: ValueInput
}

/** 创建动画复合 Value；编译时按名称、时长、缓动等语法顺序连接，省略未提供字段。 */
export function animationValue(parts: AnimationParts): Value {
  return { kind: 'value', expression: { type: 'animation', ...parts } }
}
