/** CSS 过渡内容。 */
import { createJSSContent } from '../../content'
import { propertyName, type JSSKey } from '../../key'
import type { ValueInput } from '../../value'
import type { JSSContent } from '../../content'

/** 目标、时长、缓动与可选延迟。 */
export type Transition = [key: JSSKey, duration: ValueInput, easing: ValueInput, delay?: ValueInput]

/** 延迟生成多项过渡。 */
export function transitionValue(...items: Transition[]): JSSContent {
  return createJSSContent((read) => items.map(([key, duration, easing, delay]) =>
    [propertyName(key), read(duration), read(easing), read(delay)].filter((part) => part !== undefined).join(' ')
  ).join(', '), items.flatMap(([, duration, easing, delay]) => [duration, easing, delay]))
}
