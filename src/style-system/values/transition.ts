/** CSS transition 条目。 */
import type { CSSKey } from '../core/css-key'
import type { ValueInput } from '../core/css-value'

/** 目标 Key、时长、缓动与可选延迟。 */
export type Transition = [
  key: CSSKey,
  duration: ValueInput,
  easing: ValueInput,
  delay?: ValueInput,
]
