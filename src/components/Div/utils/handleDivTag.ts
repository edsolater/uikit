import { createDataTag, hasTag } from './tag'
import { DivProps, HTMLTagMap } from '../type'
import { produce } from 'immer'

export const noRenderTag = createDataTag({ key: 'Div', value: 'no-render' })
export const offscreenTag = createDataTag({ key: 'Div', value: 'offscreen' })

export function handleDivTag<TagName extends keyof HTMLTagMap = 'div'>(
  divProps: DivProps<TagName>
): DivProps<TagName> | undefined {
  const processNoRender = (divProps: DivProps<TagName> | undefined) => {
    if (!divProps) return
    const hasNoRenderTag = hasTag(divProps.tag, noRenderTag)
    if (hasNoRenderTag) return undefined
    return divProps
  }

  const processOffscreen = (divProps: DivProps<TagName> | undefined) => {
    if (!divProps) return
    const hasOffscreenTag = hasTag(divProps.tag, offscreenTag)
    if (hasOffscreenTag) {
      return produce(divProps, (p) => {
        // @ts-ignore no need check
        p.icss = [
          p.icss,
          {
            position: 'absolute',
            top: -9999,
            left: -9999,
            pointerEvents: 'none',
            visibility: 'hidden'
          }
        ]
      })
    }
    return divProps
  }

  return handleAValue(divProps, processNoRender, processOffscreen)
}

// TODO: move to fnkit
function handleAValue<T, U>(v: T, fn1: (v: T) => U): U
function handleAValue<T, U, W>(v: T, fn1: (v: T) => U, fn2: (v: U) => W): W
function handleAValue<T, U, W, V>(v: T, fn1: (v: T) => U, fn2: (v: U) => W, fn3: (v: W) => V): V
function handleAValue<T, U, W, V, X>(v: T, fn1: (v: T) => U, fn2: (v: U) => W, fn3: (v: W) => V, fn4: (v: V) => X): X
function handleAValue<T, U, W, V, X, Y>(
  v: T,
  fn1: (v: T) => U,
  fn2: (v: U) => W,
  fn3: (v: W) => V,
  fn4: (v: V) => X,
  fn5: (v: X) => Y
): Y
function handleAValue<T, U, W, V, X, Y, Z>(
  v: T,
  fn1: (v: T) => U,
  fn2: (v: U) => W,
  fn3: (v: W) => V,
  fn4: (v: V) => X,
  fn5: (v: X) => Y,
  fn6: (v: Y) => Z
): Z
function handleAValue<T>(v: T, ...fn: ((v: T) => T)[]): T
function handleAValue<T>(v: T, ...fn: ((v: T) => T)[]): T {
  return fn.reduce((value, fn) => fn(value), v)
}
