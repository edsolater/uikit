import { AnyFn } from '@edsolater/fnkit'

/**
 * @todo it's type intelligense is not very smart for parameters
 * @deprecated use fnkit's mergeFunction instead
 * @example
 * const add = (a: number, b: number) => a + b
 * const multi = (a: number) => 3 + a
 * const c = mergeFunction(add, multi) // (a: number, b: number) => {add(a, b); multi(a, b)}
 */
export function mergeFunction<T extends AnyFn | undefined>(
  ...fns: T[]
): (...params: T extends AnyFn ? Parameters<T> : any) => void {
  return (...params) => {
    fns.forEach((fn) => fn?.(...(params as any)))
  }
}
