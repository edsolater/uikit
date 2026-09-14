/** 为指定层数内的对象提供首次写入才浅复制的代理。 */
import { isObjectLike } from '@edsolater/fnkit'

export interface LazyCopyOptions {
  /** 默认 0 只隔离自身；1 包含直接属性对象，Infinity 包含所有层。 */
  depth?: number
}

/**
 * 首次写入前仍读取来源；写入后只修改副本。非引用值原样返回。
 * @example
 * const source = { items: [1] }
 * const next = lazyCopy(source, { depth: 1 })
 * next.items.push(2) // source.items 仍为 [1]
 */
export function lazyCopy<T>(source: T, options?: LazyCopyOptions): T {
  const copies = new WeakMap<object, object>()

  /** 取得同一来源对象的稳定惰性副本。 */
  function copy<T>(value: T, depth: number): T {
    if (!isObjectLike(value)) return value
    const existing = copies.get(value)
    if (existing) return existing as T

    const sourceObject = value as object
    const target = createTarget(sourceObject)
    let current = sourceObject

    /** 首次写入时取得当前属性的浅副本。 */
    function writable() {
      if (current === sourceObject) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors({ ...sourceObject }))
        current = target
      }
      return target
    }

    const proxy = new Proxy(target, {
      /** 读取当前值，并在指定深度内继续建立惰性副本。 */
      get(_, key, receiver) {
        const result = Reflect.get(current, key, receiver)
        return depth > 0 ? copy(result, depth - 1) : result
      },
      set(_, key, next) {
        return Reflect.set(writable(), key, next)
      },
      deleteProperty(_, key) {
        return Reflect.deleteProperty(writable(), key)
      },
      defineProperty(_, key, descriptor) {
        return Reflect.defineProperty(writable(), key, descriptor)
      },
      has(_, key) {
        return Reflect.has(current, key)
      },
      ownKeys() {
        return Reflect.ownKeys(current)
      },
      getOwnPropertyDescriptor(_, key) {
        const descriptor = Reflect.getOwnPropertyDescriptor(current, key)
        if (!descriptor) return undefined
        const targetDescriptor = Reflect.getOwnPropertyDescriptor(target, key)
        return {
          ...descriptor,
          configurable: targetDescriptor?.configurable === false ? false : true,
        }
      },
      ...(typeof value === 'function' ? {
        apply(_, receiver, args) {
          return Reflect.apply(value, receiver, args)
        },
      } : {}),
    })
    copies.set(sourceObject, proxy)
    return proxy as T
  }

  return copy(source, options?.depth ?? 0)
}

/** 创建保持数组、函数或对象基本能力的代理载体。 */
function createTarget(source: object): object {
  const target = typeof source === 'function'
    ? function () {}.bind(undefined)
    : Array.isArray(source) ? [] : {}
  Reflect.deleteProperty(target, 'name')
  Reflect.deleteProperty(target, 'length')
  return Object.setPrototypeOf(target, Object.getPrototypeOf(source))
}
