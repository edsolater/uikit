import { AnyFn, AnyObj } from '../typings/constants'
import flatMayArray from '@edsolater/fnkit/src/array/flatMayArray'
import { isExist, isOneOf } from '@edsolater/fnkit/src/judgers'
import isArray from '@edsolater/fnkit/src/judgers/isArray'
import isFunction from '@edsolater/fnkit/src/judgers/isFunction'
import isObject from '@edsolater/fnkit/src/judgers/isObject'
import notNullish from '@edsolater/fnkit/src/judgers/notNullish'
import parallelSwitch from '@edsolater/fnkit/src/magic/parallelSwitch'
import _mergeObjects from '@edsolater/fnkit/src/_mergeObjects'
import mergeFunction from './mergeFunction'
import mergeRefs from './mergeRefs'

/**prop may very deep like children */
export type AnyProp = { [props: string]: any }

export default function mergeProps<P1 = AnyProp, P2 = AnyProp>(
  ...propsObjs: [P1, P2]
): Exclude<P1 & P2, undefined>
export default function mergeProps<P1 = AnyProp, P2 = AnyProp, P3 = AnyProp>(
  ...propsObjs: [P1, P2, P3]
): Exclude<P1 & P2 & P3, undefined>
export default function mergeProps<P1 = AnyProp, P2 = AnyProp, P3 = AnyProp, P4 = AnyProp>(
  ...propsObjs: [P1, P2, P3, P4]
): Exclude<P1 & P2 & P3 & P4, undefined>
export default function mergeProps<
  P1 = AnyProp,
  P2 = AnyProp,
  P3 = AnyProp,
  P4 = AnyProp,
  P5 = AnyProp
>(...propsObjs: [P1, P2, P3, P4, P5]): Exclude<P1 & P2 & P3 & P4 & P5, undefined>
export default function mergeProps<P extends AnyProp | undefined>(
  ...propsObjs: P[]
): Exclude<P, undefined> {
  const trimedProps = flatMayArray(propsObjs).filter(notNullish)
  // @ts-ignore
  if (trimedProps.length === 0) return {}
  if (trimedProps.length === 1) return trimedProps[0]
  return _mergeObjects(trimedProps, (key, v1, v2) =>
    parallelSwitch<string, any>(
      key,
      [
        ['domRef', () => (v1 && v2 ? mergeRefs(v1 as any, v2 as any) : v1 ?? v2)],
        ['className', () => [v1, v2].flat()],
        ['style', () => {
          console.log('v1, v2: ', v1, v2)
          return [v1, v2].flat()
        }],
        [() => isFunction(v1) && isFunction(v2), () => mergeFunction(v1 as AnyFn, v2 as AnyFn)],
        [() => isObject(v1) && isObject(v2), () => mergeProps(v1 as AnyObj, v2 as AnyObj)],
        [() => isArray(v1) && isArray(v2), () => (v1 as any[]).concat(v2)]
      ],
      v2 ?? v1
    )
  )
}
