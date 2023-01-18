import {
  AnyFn,
  flap,
  isArray,
  isFunction,
  isObject,
  mergeObjectsWithConfigs,
  parallelSwitch,
  shakeNil
} from '@edsolater/fnkit'
import { isValidElement } from 'react'
import { mergeFunction } from '../../utils/mergeFunction'
import { mergeRefs } from '../../utils/react'

/**prop may very deep like children */
export type AnyProp = { [props: string]: any }

export function mergeProps<P1 = AnyProp, P2 = AnyProp>(...propsObjs: [P1, P2]): Exclude<P1 & P2, undefined>
export function mergeProps<P1 = AnyProp, P2 = AnyProp, P3 = AnyProp>(
  ...propsObjs: [P1, P2, P3]
): Exclude<P1 & P2 & P3, undefined>
export function mergeProps<P1 = AnyProp, P2 = AnyProp, P3 = AnyProp, P4 = AnyProp>(
  ...propsObjs: [P1, P2, P3, P4]
): Exclude<P1 & P2 & P3 & P4, undefined>
export function mergeProps<P1 = AnyProp, P2 = AnyProp, P3 = AnyProp, P4 = AnyProp, P5 = AnyProp>(
  ...propsObjs: [P1, P2, P3, P4, P5]
): Exclude<P1 & P2 & P3 & P4 & P5, undefined>
export function mergeProps<P extends AnyProp | undefined>(...propsObjs: P[]): Exclude<P, undefined>
export function mergeProps<P extends AnyProp | undefined>(...propsObjs: P[]): Exclude<P, undefined> {
  // @ts-ignore
  if (propsObjs.length <= 1) return propsObjs[0] ?? {}
  const trimedProps = shakeNil(flap(propsObjs))
  // @ts-ignore
  if (trimedProps.length <= 1) return trimedProps[0] ?? {}

  const mergedResult = mergeObjectsWithConfigs(trimedProps, ({ key, valueA: v1, valueB: v2 }) => {
    if (isValidElement(v1) || isValidElement(v2)) return v2 ?? v1 // if v1 or v2 are react node, it will be a disaster to merge two object. so return as quick as possiable
    return parallelSwitch<string, any>(
      key,
      [
        // special div props
        ['domRef', () => (v1 && v2 ? mergeRefs(v1 as any, v2 as any) : v1 ?? v2)],
        ['className', () => (v1 && v2 ? [v1, v2].flat() : v1 ?? v2)],
        ['style', () => (v1 && v2 ? [v1, v2].flat() : v1 ?? v2)],
        ['icss', () => (v1 && v2 ? [v1, v2].flat() : v1 ?? v2)],
        ['tag', () => (v1 && v2 ? [v1, v2].flat() : v1 ?? v2)],
        ['htmlProps', () => (v1 && v2 ? [v1, v2].flat() : v1 ?? v2)],
        ['shadowProps', () => (v1 && v2 ? [v1, v2].flat() : v1 ?? v2)],
        ['plugin', () => (v1 && v2 ? [v1, v2].flat() : v1 ?? v2)],
        ['dangerousRenderWrapperNode', () => (v1 && v2 ? [v1, v2].flat() : v1 ?? v2)],
        ['controller', () => (v1 && v2 ? [v1, v2].flat() : v1 ?? v2)],
        ['children', () => v2 ?? v1],

        // normal props
        [() => isFunction(v1) && isFunction(v2) && v1 !== v2, () => mergeFunction(v1 as AnyFn, v2 as AnyFn)],
        [() => isArray(v1) && isArray(v2) && v1 !== v2, () => (v1 as any[]).concat(v2)],
        [() => isObject(v1) && isObject(v2) && v1 !== v2, () => mergeProps(v1, v2)] // if v1 and v2 are react node, it will be a disaster
      ],
      v2 ?? v1
    )
  })
  // @ts-ignore
  return mergedResult
}
