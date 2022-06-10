import { isExist } from '@edsolater/fnkit'
import type { MayArray, Valueof } from '../typings/tools'

/**
 *
 * @example
 * pickValues({a:1, b:2}, ['a', 'b']) //=> [1, 2]
 * pickValues({a:1, b:2}, 'a') //=> [1]
 * pickValues({a:1, b:2}, ['a', 'b', 'c']) //=> [1, 2]
 */
export function pickValues<T extends Record<string, any>>(
  obj: T,
  keys: MayArray<keyof T | (string & {})>
): Valueof<T>[] {
  return (
    [keys]
      .flat()
      // @ts-expect-error don't know why it's error, but it should be true
      .map((k) => obj[k])
      .filter(isExist)
  )
}
