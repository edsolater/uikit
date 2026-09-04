import { containKey, type MayFn, shrinkFn } from '@edsolater/fnkit'

type CssString = string
type CssRawValue = string | number

export type CssValue<RawValue = CssRawValue> = RawValue | { cssString: () => CssValue<RawValue> | RawValue }

export function isCssValue(value: unknown): value is CssValue {
  return containKey(value, 'cssString')
}

/** 声明，此处是一个css value.
 * 特性：幂等性（即s={cssString: () => 'hello'}; cssValue(cssValue(s)) === s ）
 */
export function cssValue(value: MayFn<CssValue | CssRawValue>): CssValue {
  if (isCssValue(value)) return value

  return {
    cssString: () => {
      const shrinkedValue = shrinkFn(value)
      const cssString = containKey(shrinkedValue, 'cssString') ? shrinkedValue.cssString : shrinkedValue
      return String(cssString)
    },
  }
}

/** 解析，将自定义的css value 解析成 css string */
export function parseCSSValue(value: CssValue | CssRawValue): CssString {
  const cssString = containKey(value, 'cssString') ? parseCSSValue(value.cssString()) : value
  return String(cssString)
}
