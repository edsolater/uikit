/** 建立可直接使用、调用后从当前属性继续派生的对象。 */
import { getKeys, mergeObjects } from '@edsolater/fnkit'
import { lazyCopy } from './lazy-copy'

/** 可直接读写当前属性，也可通过调用并合局部覆盖继续派生的对象。 */
export type DerivableObject<O extends object> = O & {
  /** 从当前属性继续派生。 */
  (override?: Partial<O>): DerivableObject<O>
}

/**
 * 将对象变成可调用的派生对象：调用时合并来源、当前自身属性和覆盖值，再建立下一对象。
 * 每个属性首次读取后缓存；对象属性通过 lazyCopy 隔离自身写入，更深层对象仍按该函数的默认深度共享。
 * @example
 * const list = deriveable({ items: [1], isActive: true })
 * const another = list({ isActive: false })
 * another.items.push(2) // list.items 仍为 [1]
 */
export function deriveable<O extends object>(source: O): DerivableObject<O> {
  const self: Record<PropertyKey, unknown> = {}

  return new Proxy((override?: Partial<O>) => deriveable(mergeObjects(source, self, override ?? {}) as O), {
    /**
     * 优先读取自身覆盖；首次读取来源属性时缓存其惰性副本，之后不再跟随该来源属性变化。
     * @example
     * const source = { count: 1 }
     * const next = deriveable(source)
     * next.count // 1，并缓存当前值
     * source.count = 2
     * next.count // 仍为 1
     */
    get(_target, key, receiver) {
      if (Object.hasOwn(self, key)) return Reflect.get(self, key, receiver)

      const sourceValue = Reflect.get(source, key, receiver)

      const lazyValue = lazyCopy(sourceValue)

      Reflect.set(self, key, lazyValue)

      return lazyValue
    },
    /** 将当前对象的属性覆盖写入 self，不修改来源。 */
    set(_target, key, value) {
      return Reflect.set(self, key, value)
    },
    /** 属性存在性合并当前覆盖和来源，来源原型链也参与判断。 */
    has( _target, key) {
      return Object.hasOwn(self, key) || Reflect.has(source, key)
    },
    /** 合并来源、当前覆盖及函数载体的键，使枚举能看到完整对象。 */
    ownKeys(target) {
      return getKeys([source, self, target])
    },
    /** 按当前覆盖、来源、函数载体的顺序取描述符，并允许代理重新定义该属性。 */
    getOwnPropertyDescriptor(target, key) {
      const descriptor =
        Reflect.getOwnPropertyDescriptor(self, key) ??
        Reflect.getOwnPropertyDescriptor(source, key) ??
        Reflect.getOwnPropertyDescriptor(target, key)
      return descriptor ? { ...descriptor, configurable: true } : undefined
    },
    /** 将描述符定义在当前覆盖对象上，不修改来源。 */
    defineProperty(_target, key, descriptor) {
      return Reflect.defineProperty(self, key, descriptor)
    },
  }) as DerivableObject<O>
}
