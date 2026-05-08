import { createMemo, type Accessor } from 'solid-js'

/**
 * 匹配器负责围绕现有 accessor 提供匹配与判断能力。
 *
 * 这个文件不创建状态，不决定值怎么更新，
 * 只负责把“当前值如何被匹配”收口成可复用的小语法。
 */

type MatcherPredicate<Value> = (value: Value) => boolean

export interface MatcherOperator<Value> {
  /**
   * 创建一个响应式匹配 accessor。
   *
   * 用于判断 source 当前值是否等于 targetValue，
   * 或满足 predicate。
   *
   * 适合：
   * - ident 是否等于某个 ident
   * - toggle 是否等于 true / false
   * - count 是否等于某个数字
   * - label 是否等于某段文本
   * - value.status === 'loaded'
   * - value.items.length === 0
   *
   * 注意：
   * - 返回 Accessor<boolean>
   * - 不会立即返回 boolean
   * - 立即判断请用 is()
   * - 传入普通值时，按 Object.is 进行等值匹配
   * - 传入函数时，按 predicate 进行条件匹配
   */
  match: (targetValueOrPredicate: Value | MatcherPredicate<Value>) => Accessor<boolean>

  /**
   * 创建一个响应式不匹配 accessor。
   *
   * 等价于响应式版本的 !match(targetValueOrPredicate)()。
   */
  notMatch: (targetValueOrPredicate: Value | MatcherPredicate<Value>) => Accessor<boolean>

  /**
   * 立即判断 source 当前值是否等于 targetValue。
   *
   * 用于命令式逻辑、事件处理、一次性判断。
   *
   * 注意：
   * - 返回 boolean
   * - 不创建 Accessor
   * - 响应式等值判断请用 match()
   */
  is: (targetValue: Value) => boolean

  /**
   * 立即判断 source 当前值是否不等于 targetValue。
   *
   * 等价于 !is(targetValue)。
   */
  isNot: (targetValue: Value) => boolean
}

/**
 * 为现有 accessor 创建匹配器。
 *
 * 该能力只包装读取，不接管状态写入。
 */
export function createMatcher<Value>(source: Accessor<Value>): MatcherOperator<Value> {
  const isPredicate = (targetValueOrPredicate: Value | MatcherPredicate<Value>): targetValueOrPredicate is MatcherPredicate<Value> => {
    return typeof targetValueOrPredicate === 'function'
  }

  const is = (targetValue: Value) => {
    return Object.is(source(), targetValue)
  }

  const isNot = (targetValue: Value) => {
    return !is(targetValue)
  }

  const match = (targetValueOrPredicate: Value | MatcherPredicate<Value>) => {
    return createMemo(() => {
      if (isPredicate(targetValueOrPredicate)) {
        return targetValueOrPredicate(source())
      }

      return is(targetValueOrPredicate)
    })
  }

  const notMatch = (targetValueOrPredicate: Value | MatcherPredicate<Value>) => {
    return createMemo(() => !match(targetValueOrPredicate)())
  }

  return {
    match,
    notMatch,
    is,
    isNot,
  }
}
