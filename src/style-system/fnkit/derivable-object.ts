/** 构造可直接使用、调用后从当前状态派生的函数对象。 */
import { lazyCopy } from './lazy-copy'

/** 兼具普通函数能力与领域属性的可派生对象。 */
export type DerivableObject<O extends object> = O & {
  /** 从当前对象继续派生。 */
  (): DerivableObject<O>
}

/** 派生后覆盖指定属性。 */
export interface DeriveObjectOptions<O extends object> {
  overrideWhenDerive?: Partial<O>
}

/** 让属性成为可派生对象；对象属性使用浅层写时复制，函数保持共享。
 * options.override 只声明派生后需要改写的属性。
 * @example
 * const list = deriveObject(
 *   { items: [1], isActive: true },
 *   { override: { isActive: false } },
 * )
 * const another = list()
 */
export function deriveObject<O extends object>(
  originalRaw: O,
  options?: DeriveObjectOptions<O>,
): DerivableObject<O> {
  let result: DerivableObject<O>

  /** 从当前函数对象建立下一层惰性属性视图。 */
  function deriveFromCurrentObject(): DerivableObject<O> {
    const properties = lazyCopyProperties(result)
    return deriveObject({ ...properties, ...options?.overrideWhenDerive }, options)
  }

  result = Object.defineProperties(
    deriveFromCurrentObject,
    Object.getOwnPropertyDescriptors(originalRaw),
  ) as DerivableObject<O>
  return result
}

/** 为每个可枚举对象属性建立惰性浅副本，其他属性保持原值。 */
function lazyCopyProperties<T extends object>(source: T): T {
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [
      key,
      value !== null && typeof value === 'object' ? lazyCopy(value) : value,
    ]),
  ) as T
}
