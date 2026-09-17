/** 为指定层数内的对象提供首次写入才浅复制的代理。 */
import { isObjectLike } from '@edsolater/fnkit'

/** 指定惰性写时复制要继续保护的对象层数。 */
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

  /**
   * 在本次 lazyCopy 调用内复用同一来源对象的代理；首次创建时的 depth 决定后续读取的复制深度。
   * 非引用值原样返回，创建代理不枚举来源属性；对代理的写入只在首次写操作时取得浅副本。
   * @example
   * const source = { count: 1 }
   * copy(source, 0) === copy(source, 0) // true
   * copy(source, 0).count = 2 // source.count 仍为 1
   */
  function copy<T>(value: T, depth: number): T {
    if (!isObjectLike(value)) return value
    const existing = copies.get(value)
    if (existing) return existing as T

    const sourceObject = value as object
    const target = createTarget(sourceObject)
    let current = sourceObject

    /**
     * 首次写入前，把来源当前的可枚举自有属性值复制到代理载体；之后始终返回同一载体。
     * 复制会读取来源访问器，函数和数组的基本能力由 createTarget 提供。
     * @example
     * writable().count = 2 // 只改副本；下一次 writable() 返回这个已修改的载体。
     */
    function writable() {
      if (current === sourceObject) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors({ ...sourceObject }))
        current = target
      }
      return target
    }

    const proxy = new Proxy(target, {
      /** 读取当前来源或副本；depth 大于零时对子对象使用下一层惰性代理。 */
      get(_, key, receiver) {
        const result = Reflect.get(current, key, receiver)
        return depth > 0 ? copy(result, depth - 1) : result
      },
      /** 首次写入取得浅副本，再写入当前属性。 */
      set(_, key, next) {
        return Reflect.set(writable(), key, next)
      },
      /** 在副本上删除属性，不删除来源属性。 */
      deleteProperty(_, key) {
        return Reflect.deleteProperty(writable(), key)
      },
      /** 属性描述符写入副本，不改写来源描述符。 */
      defineProperty(_, key, descriptor) {
        return Reflect.defineProperty(writable(), key, descriptor)
      },
      /** 按当前来源或副本判断属性存在性，包含原型链。 */
      has(_, key) {
        return Reflect.has(current, key)
      },
      /** 枚举当前来源或副本的自有属性。 */
      ownKeys() {
        return Reflect.ownKeys(current)
      },
      /**
       * 返回当前属性描述符；只有代理载体自身不可配置的属性保持该限制，避免违反 Proxy 约束。
       * @example
       * // 当前来源为数组时：
       * Object.getOwnPropertyDescriptor(proxy, 'length')?.configurable // false
       */
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
        /** 调用来源函数，保留调用方的 this 和实参，不触发属性复制。 */
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

/**
 * 创建同原型的空代理载体，保留数组身份或函数可调用能力，但不复制来源属性。
 * 函数载体去掉自身 name/length，让这些属性可由代理反映来源。
 * @example
 * Array.isArray(createTarget([1, 2])) // true；新载体此时仍为空数组。
 * typeof createTarget(() => 1) // 'function'
 */
function createTarget(source: object): object {
  const target = typeof source === 'function'
    ? function () {}.bind(undefined)
    : Array.isArray(source) ? [] : {}
  Reflect.deleteProperty(target, 'name')
  Reflect.deleteProperty(target, 'length')
  return Object.setPrototypeOf(target, Object.getPrototypeOf(source))
}
