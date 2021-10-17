import { shrinkToValue } from '@edsolater/fnkit/src/magic'

type MayFunction<T, Params extends any[] = []> = T | ((...params: Params) => T)
type MayPromise<T> = T | Promise<T>

/**
 * switch **promise error** to a **promise fallback value**
 * @example
 * asyncCatch(
 *   () => Math.random() > 0.5
 * ).then(console.log) // => true | undefined
 *
 * asyncCatch(
 *   Promise.reject('hello'),
 *   Promise.resolve('world')
 * ).then(console.log) // => 'world'
 *
 * asyncCatch(
 *   Promise.reject(1),
 *   (err) => Promise.reject('hello'),
 *   (err) => Promise.resolve(err + ' world')
 * ).then(console.log) // => 'hello world'
 *
 */
// useful undefind default fallback
export default async function asyncCatch<V>(candidate: MayFunction<MayPromise<V>>): Promise<V | undefined>
export default async function asyncCatch<V extends any, E extends any>(
  ...candidates: [MayFunction<MayPromise<V>>, ...MayFunction<MayPromise<E>, [err: unknown]>[]]
): Promise<V | E>
export default async function asyncCatch<V extends any, E extends any>(
  ...candidates: [MayFunction<MayPromise<V>>, ...MayFunction<MayPromise<E>, [err: unknown]>[]]
): Promise<V | E> {
  return new Promise(async (resolve) => {
    // because action is not pure, should not use purer method:`reduce()`. Although `reduce()` can reduce code, it is confusing
    let cachedErr: unknown = undefined
    for (const ca of candidates) {
      try {
        resolve(await shrinkToValue(ca, [cachedErr]))
        break
      } catch (err) {
        cachedErr = err
        continue
      }
    }

    // (it works but, no unpure reduce!!!)
    // candidates.reduce(
    //   (acc, i) => acc.catch(async (err) => resolve(await shrinkToValue(i, [err]))) as any,
    //   Promise.reject()
    // )
  })
}
