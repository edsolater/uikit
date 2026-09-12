/** 建立可直接使用、调用后从当前属性继续派生的对象。 */
import { getKeys, mergeObjects } from '@edsolater/fnkit'
import { lazyCopy } from './lazy-copy'

/** 兼具领域属性和派生调用的对象。 */
export type DerivableObject<O extends object> = O & {
  /** 从当前属性继续派生。 */
  (override?: Partial<O>): DerivableObject<O>
}

/** 属性首次读取时取得惰性副本；调用时由当前属性和覆盖值派生下一对象。
 * @example
 * const list = deriveable({ items: [1], isActive: true })
 * const another = list({ isActive: false })
 * another.items.push(2) // list.items 仍为 [1]
 */
export function deriveable<O extends object>(source: O): DerivableObject<O> {
  const self: Record<PropertyKey, unknown> = {}

  return new Proxy((override?: Partial<O>) => deriveable(mergeObjects(source, self, override ?? {}) as O), {
    /** 优先读取当前属性，只为来源中的引用值建立惰性副本。 */
    get(_target, key, receiver) {
      if (Object.hasOwn(self, key)) return Reflect.get(self, key, receiver)

      // 读取来源
      const sourceValue = Reflect.get(source, key, receiver)

      // 创造惰性副本
      const lazyValue = lazyCopy(sourceValue)

      // 写入自身
      Reflect.set(self, key, lazyValue)

      return lazyValue
    },
    /** 将赋值保存在当前对象。 */
    set(_target, key, value) {
      return Reflect.set(self, key, value)
    },
    /** 查询当前对象、来源或函数载体中的属性。 */
    has( _target, key) {
      return Object.hasOwn(self, key) || Reflect.has(source, key)
    },
    /** 枚举当前对象能够提供的全部属性。 */
    ownKeys(target) {
      return getKeys([source, self, target])
    },
    /** 取得当前对象能够提供的属性描述符。 */
    getOwnPropertyDescriptor(target, key) {
      const descriptor =
        Reflect.getOwnPropertyDescriptor(self, key) ??
        Reflect.getOwnPropertyDescriptor(source, key) ??
        Reflect.getOwnPropertyDescriptor(target, key)
      return descriptor ? { ...descriptor, configurable: true } : undefined
    },
    /** 将新属性定义在当前对象。 */
    defineProperty(_target, key, descriptor) {
      return Reflect.defineProperty(self, key, descriptor)
    },
  }) as DerivableObject<O>
}
