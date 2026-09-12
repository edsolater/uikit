/** 为对象图提供按对象首次写入才浅复制的稳定视图。 */

/** 决定是否把嵌套对象纳入当前写时复制视图。 */
export interface LazyCopyOptions {
  /** 默认只隔离传入对象；启用后也隔离嵌套对象。 */
  deep?: boolean
}

/** 返回惰性副本；非对象原值返回，未写入的对象持续读取来源。
 * 默认保留字段值的原引用；deep 模式递归代理，并保留别名和循环引用。
 * 两种模式读取均不浅复制；每个被代理对象只在首次写入时浅复制。
 * 隔离范围是属性写入、删除和定义；函数照常调用，不隔离闭包或外部副作用。
 * Map、Date 等内部槽和类私有字段不属于属性协议，不能通过此视图操作。
 * 显式定义的不可配置且不可写属性必须原样返回指定值，不再代理该值。
 * @example
 * const source = [1]
 * const next = lazyCopy(source)
 * next.push(2) // source 仍为 [1]
 * const nested = lazyCopy({ items: source }, { deep: true })
 * nested.items.push(3) // source 仍为 [1]
 */
export function lazyCopy<T>(source: T, options?: LazyCopyOptions): T {
  const views = new WeakMap<object, object>()

  /** 取得当前对象图中同一来源的稳定代理。 */
  function view<T>(value: T): T {
    if (value === null || (typeof value !== 'object' && typeof value !== 'function')) {
      return value
    }
    const existing = views.get(value)
    if (existing) return existing as T

    const target = createTarget(value)
    let copied = false

    /** 首次写入时复制当前属性描述符，不求值访问器或复制子对象。 */
    function writable(): object {
      if (!copied) {
        const descriptors = Object.getOwnPropertyDescriptors(value)
        for (const key of Reflect.ownKeys(target)) {
          if (!Object.hasOwn(descriptors, key)) Reflect.deleteProperty(target, key)
        }
        for (const key of Reflect.ownKeys(descriptors)) {
          const descriptor = descriptors[key as keyof typeof descriptors]
          if (options?.deep && 'value' in descriptor) descriptor.value = view(descriptor.value)
        }
        Object.defineProperties(target, descriptors)
        copied = true
      }
      return target
    }

    const proxy = new Proxy(target, {
      /** 读取当前属性，并把对象引用接回同一惰性视图。 */
      get(_, key, receiver) {
        const fixed = copied && Reflect.getOwnPropertyDescriptor(target, key)
        if (fixed && fixed.configurable === false && fixed.writable === false) return fixed.value
        const result = Reflect.get(copied ? target : value, key, receiver)
        return options?.deep ? view(result) : result
      },
      /** 让赋值及访问器通过当前副本完成写入。 */
      set(_, key, next, receiver) {
        return Reflect.set(writable(), key, next, receiver)
      },
      /** 在副本上删除属性。 */
      deleteProperty(_, key) {
        return Reflect.deleteProperty(writable(), key)
      },
      /** 在副本上定义属性，保留调用者指定的描述符身份约束。 */
      defineProperty(_, key, descriptor) {
        return Reflect.defineProperty(writable(), key, descriptor)
      },
      /** 查询当前视图中的属性存在性。 */
      has(_, key) {
        return Reflect.has(copied ? target : value, key)
      },
      /** 枚举当前视图中的自有属性。 */
      ownKeys() {
        return Reflect.ownKeys(copied ? target : value)
      },
      /** 暴露当前描述符；复制前的虚拟属性须保持可配置。 */
      getOwnPropertyDescriptor(_, key) {
        const descriptor = Reflect.getOwnPropertyDescriptor(copied ? target : value, key)
        if (!descriptor) return undefined
        return {
          ...descriptor,
          ...(options?.deep && 'value' in descriptor && !(copied && !descriptor.configurable && !descriptor.writable)
            ? { value: view(descriptor.value) }
            : {}),
          configurable: copied
            ? descriptor.configurable
            : Reflect.getOwnPropertyDescriptor(target, key)?.configurable !== false,
        }
      },
      /** 读取当前对象的原型。 */
      getPrototypeOf() {
        return Reflect.getPrototypeOf(copied ? target : value)
      },
      /** 在副本上改写原型。 */
      setPrototypeOf(_, prototype) {
        return Reflect.setPrototypeOf(writable(), prototype)
      },
      /** 实体化属性后关闭副本扩展，满足代理不变量。 */
      preventExtensions() {
        return Reflect.preventExtensions(writable())
      },
      ...(typeof value === 'function' ? {
        /** 保留函数调用及接收者语义。 */
        apply(_, receiver, args) {
          return Reflect.apply(value, receiver, args)
        },
        /** 保留构造调用，由来源函数判断自身是否可构造。 */
        construct(_, args, newTarget) {
          return Reflect.construct(value, args, newTarget === proxy ? value : newTarget)
        },
      } : {}),
    })
    views.set(value, proxy)
    views.set(proxy, proxy)
    return proxy as T
  }

  return view(source)
}

/** 创建不含来源属性的代理载体，保留数组身份、函数能力及原型。 */
function createTarget(source: object): object {
  const target = typeof source === 'function'
    ? function () {}.bind(undefined)
    : Array.isArray(source) ? [] : {}
  return Object.setPrototypeOf(target, Object.getPrototypeOf(source))
}
