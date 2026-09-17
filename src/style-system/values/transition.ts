/** 一项过渡的目标属性、时长、缓动与可选延迟。 */
import type { CSSProperty } from '../core/css-key'
import type { ValueInput } from '../core/css-value'

/** 一个 CSS transition 条目：目标属性、持续时间和缓动为必填，延迟可选；各部分保留 Value 的 Condition。 */
export type Transition = [
  property: CSSProperty,
  duration: ValueInput,
  easing: ValueInput,
  delay?: ValueInput,
]
