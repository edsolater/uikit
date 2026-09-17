/** 动画值与按需帧定义。 */
import { condition } from '../core/css-condition'
import type { Rules } from '../core/css-rule'
import { value, type Value, type ValueInput } from '../core/css-value'

/** 创建动画名称 Value；消费时提供本次编译的 `@keyframes`。 */
export function animationName(name: string, frames: Rules): Value {
  return value(name, { onActive: () => new Map([[[[condition(`@keyframes ${name}`)], undefined], frames]]) })
}

/** CSS animation 组成。 */
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

/** 创建动画复合值。 */
export function animationValue(parts: AnimationParts): Value {
  return { kind: 'value', expression: { type: 'animation', ...parts } }
}
