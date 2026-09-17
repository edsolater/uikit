/** 指定深度的惰性写时复制。 */
import { isObjectLike } from '@edsolater/fnkit'

/** 写时复制深度。 */
export interface LazyCopyOptions {
  /** 0 只复制自身；1 包含直接子对象；Infinity 包含全部层。 */
  depth?: number
}

/** 创建惰性副本；默认仅本层写时复制，子对象按 depth 处理。 */
export function lazyCopy<T>(source: T, options?: LazyCopyOptions): T {
  const copies = new WeakMap<object, object>()

  /** 为同一来源复用代理；首次创建的 depth 生效。 */
  function copy<T>(value: T, depth: number): T {
    if (!isObjectLike(value)) return value
    const existing = copies.get(value)
    if (existing) return existing as T

    const sourceObject = value as object
    const target = createTarget(sourceObject)
    let current = sourceObject

    /** 首次写入时复制当前可枚举自有属性。 */
    function writable() {
      if (current === sourceObject) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors({ ...sourceObject }))
        current = target
      }
      return target
    }

    const proxy = new Proxy(target, {
      /** 读取当前值，并按深度代理子对象。 */
      get(_, key, receiver) {
        const result = Reflect.get(current, key, receiver)
        return depth > 0 ? copy(result, depth - 1) : result
      },
      /** 写入惰性副本。 */
      set(_, key, next) {
        return Reflect.set(writable(), key, next)
      },
      /** 从惰性副本删除属性。 */
      deleteProperty(_, key) {
        return Reflect.deleteProperty(writable(), key)
      },
      /** 在惰性副本定义属性。 */
      defineProperty(_, key, descriptor) {
        return Reflect.defineProperty(writable(), key, descriptor)
      },
      /** 判断当前值的属性存在性。 */
      has(_, key) {
        return Reflect.has(current, key)
      },
      /** 枚举当前值的自有属性。 */
      ownKeys() {
        return Reflect.ownKeys(current)
      },
      /** 读取描述符，并保留载体不可配置属性的约束。 */
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
        /** 调用来源函数，不触发复制。 */
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

/** 创建保留原型、数组身份或可调用能力的空代理载体。 */
function createTarget(source: object): object {
  const target = typeof source === 'function'
    ? function () {}.bind(undefined)
    : Array.isArray(source) ? [] : {}
  Reflect.deleteProperty(target, 'name')
  Reflect.deleteProperty(target, 'length')
  return Object.setPrototypeOf(target, Object.getPrototypeOf(source))
}
