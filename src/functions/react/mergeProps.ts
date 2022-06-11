import { flap, isArray, isFunction, isObject, notNullish, parallelSwitch, mergeObjectsWithConfigs } from '@edsolater/fnkit/dist-old'
import { AnyFn, AnyObj } from '../../typings/constants'
import mergeFunction from '../mergeFunction'
import mergeRefs from './mergeRefs'

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
  const trimedProps = flap(propsObjs).filter(notNullish)
  // @ts-ignore
  if (trimedProps.length === 0) return {}
  // @ts-ignore
  if (trimedProps.length === 1) return trimedProps[0]
  const mergedResult = mergeObjectsWithConfigs(trimedProps, ({ key, valueA: v1, valueB: v2 }) =>
    parallelSwitch<string, any>(
      key,
      [
        ['domRef', () => (v1 && v2 ? mergeRefs(v1 as any, v2 as any) : v1 ?? v2)],
        ['className', () => (v1 && v2 ? [v1, v2].flat() : v1 ?? v2)],
        ['style', () => (v1 && v2 ? [v1, v2].flat() : v1 ?? v2)],
        ['icss', () => (v1 && v2 ? [v1, v2].flat() : v1 ?? v2)],
        ['tag', () => (v1 && v2 ? [v1, v2].flat() : v1 ?? v2)],
        ['domRef_', () => (v1 && v2 ? mergeRefs(v1 as any, v2 as any) : v1 ?? v2)],
        ['className_', () => (v1 && v2 ? [v1, v2].flat() : v1 ?? v2)],
        ['style_', () => (v1 && v2 ? [v1, v2].flat() : v1 ?? v2)],
        ['icss_', () => (v1 && v2 ? [v1, v2].flat() : v1 ?? v2)],
        ['tag_', () => (v1 && v2 ? [v1, v2].flat() : v1 ?? v2)],
        [() => isFunction(v1) && isFunction(v2), () => mergeFunction(v1 as AnyFn, v2 as AnyFn)],
        [() => isObject(v1) && isObject(v2), () => mergeProps(v1 as AnyObj, v2 as AnyObj)],
        [() => isArray(v1) && isArray(v2), () => (v1 as any[]).concat(v2)]
      ],
      v2 ?? v1
    )
  )
  // @ts-ignore
  return mergedResult
}
