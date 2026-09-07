import { containKey, iife, isFunction, type MayFn, result, shrinkFn } from '@edsolater/fnkit'

type CssString = string

/** 可直观表示成字符串的 */
type CssRaw = string | number

/** 内部有激活链 */
const isCssActive = Symbol('css-active-chain')

export type CssValue = {
  /** 是否已被激活, 不推荐查看，但允许查看 */
  readonly [isCssActive]: boolean
  /** 激活 */
  activate(): void
  setValue(inputValue: MayFn<CssValue | CssRaw, [prev: CssRaw]>)
  /** 生成 cssString */

  toCssRaw: () => CssRaw
  [Symbol.toPrimitive](): string | number
}

export function isCssValue(value: unknown): value is CssValue {
  return containKey(value, 'toCssRaw')
}

/** 声明，此处是一个css value.
 * 特性：幂等性（即s={cssString: () => 'hello'}; cssValue(cssValue(s)) === s ）
 */
export function cssValue(value: MayFn<CssValue | CssRaw>, options?: { onActive?: () => void }): CssValue {
  if (isCssValue(value)) return value

  let currentValue = value
  let isActive = false

  const cssValue = {
    activate() {
      isActive = true
      options?.onActive?.()
    },
    get [isCssActive]() {
      return isActive
    },

    setValue(inputValue: MayFn<CssValue | CssRaw, [prev: CssRaw]>) {
      let beforeSetValue = (() => {
        const needAccessPrevValue = isFunction(inputValue) && inputValue.length === 2
        if (needAccessPrevValue) {
          return toCssRawValue(shrinkFn(currentValue))
        } else {
          return undefined // 无所谓是啥， 反正使用者不获取
        }
      })()
      const newValue = () => shrinkFn(inputValue, [beforeSetValue as CssRaw])
      currentValue = newValue
    },
    toCssRaw: () => toCssRawValue(shrinkFn(currentValue)),
    [Symbol.toPrimitive]: () => toCssString(cssValue),
  } satisfies CssValue

  return cssValue
}

/** 解析并激活cssValue，将自定义的css value 解析成 css string
 * @deprecated 直接使用toCssRaw，或者干脆不用， 反正支持了Symbol.toPrimitive，支持JS引擎的字符串操作
 */
export function toCssString(cssValue: CssValue | CssRaw): CssString {
  return String(toCssRawValue(cssValue))
}
export function toCssRawValue(cssValue: CssValue | CssRaw): CssRaw {
  const isCssValueObj = isCssValue(cssValue)
  if (isCssValueObj) {
    return toCssString((cssValue as CssValue).toCssRaw())
  }
  return cssValue
}

