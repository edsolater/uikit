/** 为指定层数内的对象提供首次写入才浅复制的代理。 */
import { isObjectLike } from '@edsolater/fnkit'

/** 指定写时复制覆盖的对象层数。 */
export interface LazyCopyOptions {
  /** 默认 0 只隔离自身；1 包含直接属性对象，Infinity 包含所有层。 */
  depth?: number
}

/** 返回惰性副本；非引用值直接返回，每个对象只在首次写入时浅复制。
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
      /** 首次赋值前取得浅副本。 */
      set(_, key, next) {
        return Reflect.set(writable(), key, next)
      },
      /** 首次删除前取得浅副本。 */
      deleteProperty(_, key) {
        return Reflect.deleteProperty(writable(), key)
      },
      /** 首次定义属性前取得浅副本。 */
      defineProperty(_, key, descriptor) {
        return Reflect.defineProperty(writable(), key, descriptor)
      },
      /** 查询当前来源或副本中的属性。 */
      has(_, key) {
        return Reflect.has(current, key)
      },
      /** 枚举当前来源或副本中的属性。 */
      ownKeys() {
        return Reflect.ownKeys(current)
      },
      /** 取得当前来源或副本中的属性描述符。 */
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
        /** 保持可调用对象的调用行为。 */
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
