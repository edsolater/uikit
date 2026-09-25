/** CSS 过渡内容。 */
import { cssContent } from '../../value'
import { propertyName, type CSSKey } from '../../css-key'
import type { CSSFunction, ValueInput } from '../../value'

/** 目标、时长、缓动与可选延迟。 */
export type Transition = [key: CSSKey, duration: ValueInput, easing: ValueInput, delay?: ValueInput]

/** 延迟生成多项过渡。 */
export function transitionValue(...items: Transition[]): CSSFunction {
  return cssContent((read) => items.map(([key, duration, easing, delay]) =>
    [propertyName(key), read(duration), read(easing), read(delay)].filter((part) => part !== undefined).join(' ')
  ).join(', '), items.flatMap(([, duration, easing, delay]) => [duration, easing, delay]))
}
