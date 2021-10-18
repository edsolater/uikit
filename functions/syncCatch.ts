import { isObject } from '@edsolater/fnkit/src/judgers'
import { shrinkToValue } from '@edsolater/fnkit/src/magic'

type MayFunction<T, Params extends any[] = []> = T | ((...params: Params) => T)

/**
 * switch **promise error** to a **promise fallback value**
 * @example
 *
 * const a = syncCatch(() => Math.random() > 0.5) // => true | undefined
 *
 * const a = syncCatch(() => Math.random() > 0.5, false) // => false
 *
 * // it's meaningless, that can't catch console.error();
 * // but for not bresking type system in DEBUG and stay similar interface with asyncCatch, it should be
 * const a = syncCatch(Math.random() > 0.5, false) // => false
 */
// useful callback for debug
export default function syncCatch<V>(candidate: MayFunction<V>): V
export default function syncCatch<V extends any, E extends any>(
  ...candidates: [MayFunction<V>, ...MayFunction<E, [err: unknown]>[]]
): V | E
export default function syncCatch<V extends any, E extends any>(
  ...candidates: [MayFunction<V>, ...MayFunction<E, [err: unknown]>[]]
): unknown {
  // because action is not pure, should not use purer method:`reduce()`. Although `reduce()` can reduce code, it is confusing
  let cachedErr: unknown = undefined
  for (const ca of candidates) {
    try {
      return shrinkToValue(ca, [cachedErr])
    } catch (err) {
      cachedErr = isObject(err) ? err : new Error(err as string)
      continue
    }
  }

  throw new Error('all sync candidates are wrong')
}
