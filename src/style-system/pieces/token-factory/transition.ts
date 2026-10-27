/** CSS 过渡内容。 */
import { propertyName, type JSSKey } from '../../key'
import { token, type Token, type TokenInput } from '../../token'

/** 目标、时长、缓动与可选延迟。 */
export type Transition = [
  key: JSSKey,
  duration: TokenInput,
  easing: TokenInput,
  delay?: TokenInput,
]

/**
 * 延迟生成多项过渡。
 */
export function transitionValue(...items: Transition[]): Token<Transition[]> {
  return token<Transition[]>(
    { default: items },
    {
      dependencies: (items) =>
        items.flatMap(([, duration, easing, delay]) => [
          duration,
          easing,
          delay,
        ]),
      toCSSString: (items, resolve) =>
        items
          .map(([key, duration, easing, delay]) =>
            [
              propertyName(key),
              resolve(duration),
              resolve(easing),
              resolve(delay),
            ]
              .filter((part) => part !== undefined)
              .join(' '),
          )
          .join(', '),
    },
  )
}
