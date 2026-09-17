/** 可调用派生对象。 */
import { getKeys, mergeObjects } from '@edsolater/fnkit'
import { lazyCopy } from './lazy-copy'

/** 可读写、也可通过调用继续派生的对象。 */
export type DerivableObject<O extends object> = O & {
  /** 合并覆盖并继续派生。 */
  (override?: Partial<O>): DerivableObject<O>
}

/** 创建可调用派生对象；首次读取固定属性值，直接子对象写时复制。 */
export function deriveable<O extends object>(source: O): DerivableObject<O> {
  const self: Record<PropertyKey, unknown> = {}

  return new Proxy((override?: Partial<O>) => deriveable(mergeObjects(source, self, override ?? {}) as O), {
    /** 读取自身覆盖，或固定来源属性的惰性副本。 */
    get(_target, key, receiver) {
      if (Object.hasOwn(self, key)) return Reflect.get(self, key, receiver)

      const sourceValue = Reflect.get(source, key, receiver)

      const lazyValue = lazyCopy(sourceValue)

      Reflect.set(self, key, lazyValue)

      return lazyValue
    },
    /** 写入当前对象，不改来源。 */
    set(_target, key, value) {
      return Reflect.set(self, key, value)
    },
    /** 合并当前对象与来源的属性存在性。 */
    has( _target, key) {
      return Object.hasOwn(self, key) || Reflect.has(source, key)
    },
    /** 合并来源、当前对象与函数载体的键。 */
    ownKeys(target) {
      return getKeys([source, self, target])
    },
    /** 按当前对象、来源、载体的顺序读取描述符。 */
    getOwnPropertyDescriptor(target, key) {
      const descriptor =
        Reflect.getOwnPropertyDescriptor(self, key) ??
        Reflect.getOwnPropertyDescriptor(source, key) ??
        Reflect.getOwnPropertyDescriptor(target, key)
      return descriptor ? { ...descriptor, configurable: true } : undefined
    },
    /** 在当前对象上定义属性。 */
    defineProperty(_target, key, descriptor) {
      return Reflect.defineProperty(self, key, descriptor)
    },
  }) as DerivableObject<O>
}
