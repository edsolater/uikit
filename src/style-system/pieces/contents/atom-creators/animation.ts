/** CSS 动画内容与按需帧定义。 */
import { createJSSContent } from '../../../content'
import { condition } from '../../../condition'
import type { Rules } from '../../../rule'
import { value, type Value, type ValueInput } from '../../../value'
import type { JSSContent } from '../../../content'

/** 动画名称；使用时提供帧定义。 */
export function animationName(name: string, frames: Rules): Value {
  return value(name, { onActive: () => [[[condition(`@keyframes ${name}`)], undefined, frames]] })
}

/** 单条动画配置。 */
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

/** 延迟生成动画内容。 */
export function animationValue(parts: AnimationParts): JSSContent {
  return createJSSContent((read) => [
    read(parts.name), read(parts.duration), read(parts.easing), read(parts.delay),
    read(parts.iterations), read(parts.direction), read(parts.fillMode), read(parts.playState),
  ].filter((part) => part !== undefined).join(' '), [
    parts.name, parts.duration, parts.easing, parts.delay,
    parts.iterations, parts.direction, parts.fillMode, parts.playState,
  ])
}
