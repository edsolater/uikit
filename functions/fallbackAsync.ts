import { shrinkToValue } from '@edsolater/fnkit/src/magic'

type MayFunction<T, Params extends any[] = []> = T | ((...params: Params) => T)
type MayPromise<T> = T | Promise<T>

/**
 * switch **promise error** to a **promise fallback value**
 * @example
 * fallbackAsync(
 *   Promise.reject('hello'),
 *   Promise.resolve('world')
 * ).then(console.log) // => 'world'
 *
 * fallbackAsync(
 *   Promise.reject(1),
 *   async (err) => await Promise.reject('hello'),
 *   (err) => Promise.resolve('world')
 * ).then(console.log) // => 'world'
 *
 */
export default async function fallbackAsync<V extends any, E extends any>(
  ...candidates: [MayFunction<MayPromise<V>>, ...MayFunction<MayPromise<E>, [err: unknown]>[]]
): Promise<V | E> {
  return new Promise(async (resolve) => {
    await candidates.reduce(
      (acc, i) =>
        acc.then(
          async (val) => resolve(await shrinkToValue(i, [val])),
          async (err) => resolve(await shrinkToValue(i, [err]))
        ),
      Promise.resolve()
    )
  })
}
