import { createComputed } from 'solid-js'
import { val, type Source } from './read'
import { createState, type ReadableState } from './state'

/** 【工具函数】派生出一个新的state,逻辑上，返回的是readableState */
export function derive<T, R>(sources: [Source<T>], combiner: (a: T) => R): ReadableState<R>
export function derive<T, U, R>(sources: [Source<T>, Source<U>], combiner: (a: T, b: U) => R): ReadableState<R>
export function derive<T, U, W, R>(
  sources: [Source<T>, Source<U>, Source<W>],
  combiner: (a: T, b: U, c: W) => R,
): ReadableState<R>
export function derive<T, U, W, X, R>(
  sources: [Source<T>, Source<U>, Source<W>, Source<X>],
  combiner: (a: T, b: U, c: W, d: X) => R,
): ReadableState<R>
export function derive<T, U, W, X, Y, Z, R>(
  sources: [Source<T>, Source<U>, Source<W>, Source<X>, Source<Y>, Source<Z>],
  combiner: (a: T, b: U, c: W, d: X, e: Y, f: Z) => R,
): ReadableState<R>
export function derive<T, R>(sources: Source<T>[], combiner: (...args: T[]) => R): ReadableState<R>
export function derive<R>(sources: Source<any>[], combiner: (...args: any[]) => R): any {
  const newState = createState()
  createComputed(() => {
    const vals = sources.map((source) => val(source))
    newState.set(combiner(...vals))
  })
  return newState
}
