import { MayDeepArray } from '../typings/tools'
import {
  filter,
  isObject,
  shrinkToValue,
  flapDeep,
  mergeObjectsWithConfigs,
  isString,
  isArray,
  mapEntry,
  isFunction
} from '@edsolater/fnkit/dist-old'
import { css, CSSObject } from '@emotion/css'

// nterface MayArrayValueCSSObject {
//   [key: keyof CSSObject]: MayArray<CSSObject[typeof key]>
// }
// actually, CSSObject === MayArrayValueCSSObject
export type ICSSObject = CSSObject
export type ICSS = MayDeepArray<
  ICSSObject | boolean | string | number | null | undefined | ((preResult: ICSSObject) => ICSSObject)
>
export function parseCSS(cssProp: ICSS) {
  const cssObjList = filter(flapDeep(cssProp), isObject)
  if (!cssObjList.length) return ''
  const mergedCSSObj = cssObjList.reduce((acc: CSSObject, cur) => mergeICSS(acc, shrinkToValue(cur, [acc])), {})
  return css(mergedCSSObj)
}

/** for typescript type */
export function createICSS(...icsses: ICSS[]): ICSS {
  return icsses.length <= 1 ? icsses[0] : icsses
}

const compositeMap = {
  transform: {
    isCompositableValue: (v: string) => isString(v) && v.startsWith('+'),
    toCompositeValue: (v: string) => `+${v}`,
    composeTwoValue: (v1: string, v2: string) =>
      v1 && v2 ? `${withoutPlus(v1)} ${withoutPlus(v2)}` : withoutPlus(v1) ?? withoutPlus(v2)
  }
}

export function composifyICSS(icss: ICSS): ICSS {
  if (isArray(icss)) return icss.map(composifyICSS)
  return isObject(icss) && !isFunction(icss)
    ? mapEntry(icss, ([k, v]) => [k, compositeMap[k]?.toCompositeValue(v) ?? v])
    : icss
}

const a: CSSObject | ((preResult: CSSObject) => CSSObject) = { a: 's' }
if (isObject(a)) {
  a
}

export function mergeICSS(...icsses: ICSSObject[]): CSSObject {
  return mergeObjectsWithConfigs(icsses, ({ key, valueA: v1, valueB: v2 }) => {
    if (key in compositeMap && compositeMap[key].isCompositableValue(v2)) {
      return compositeMap[key].composeTwoValue(v1, v2)
    }
    return withoutPlus(v2) ?? v1
  })
}

function withoutPlus<T>(v: T): T {
  return (isString(v) && v.startsWith('+') ? v.slice(1) : v) as T
}
