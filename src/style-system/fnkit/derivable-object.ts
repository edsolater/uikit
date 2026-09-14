/** 建立可直接使用、调用后从当前属性继续派生的对象。 */
import { getKeys, mergeObjects } from '@edsolater/fnkit'
import { lazyCopy } from './lazy-copy'

export type DerivableObject<O extends object> = O & {
  /** 从当前属性继续派生。 */
  (override?: Partial<O>): DerivableObject<O>
}

/**
 * 对象增加一个可选能力：复制自身（惰性）----产生一个额外的独立副本。
 * 属性首次读取时取得惰性副本；调用时由当前属性和覆盖值派生下一对象。
 * @example
 * const list = deriveable({ items: [1], isActive: true })
 * const another = list({ isActive: false })
 * another.items.push(2) // list.items 仍为 [1]
 */
export function deriveable<O extends object>(source: O): DerivableObject<O> {
  const self: Record<PropertyKey, unknown> = {}

  return new Proxy((override?: Partial<O>) => deriveable(mergeObjects(source, self, override ?? {}) as O), {
    /** 首次读取后缓存该属性，不再重新读取来源属性。 */
    get(_target, key, receiver) {
      if (Object.hasOwn(self, key)) return Reflect.get(self, key, receiver)

      const sourceValue = Reflect.get(source, key, receiver)

      const lazyValue = lazyCopy(sourceValue)

      Reflect.set(self, key, lazyValue)

      return lazyValue
    },
    set(_target, key, value) {
      return Reflect.set(self, key, value)
    },
    has( _target, key) {
      return Object.hasOwn(self, key) || Reflect.has(source, key)
    },
    ownKeys(target) {
      return getKeys([source, self, target])
    },
    getOwnPropertyDescriptor(target, key) {
      const descriptor =
        Reflect.getOwnPropertyDescriptor(self, key) ??
        Reflect.getOwnPropertyDescriptor(source, key) ??
        Reflect.getOwnPropertyDescriptor(target, key)
      return descriptor ? { ...descriptor, configurable: true } : undefined
    },
    defineProperty(_target, key, descriptor) {
      return Reflect.defineProperty(self, key, descriptor)
    },
  }) as DerivableObject<O>
}
