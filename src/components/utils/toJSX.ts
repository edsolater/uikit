import { isBigInt, isSymbol, type Stringable } from '@edsolater/fnkit'
import type { JSX } from '@/foundation'

export type JSXable = JSX.Element | Stringable

/**
 * 将 Stringable 或 renderParts 返回值收口成 JSX 可消费内容。
 * bigint 和 symbol 不能直接作为 JSX children，因此在组件根内统一字符串化。
 */
export function toJSX(value: JSXable): JSX.Element {
  if (value === null || value === undefined) {
    return ''
  }

  if (isBigInt(value) || isSymbol(value)) {
    return String(value)
  }

  return value as JSX.Element
}
