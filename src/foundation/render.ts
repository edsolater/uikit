/**
 * Solid 渲染、根作用域与 props 接入。
 *
 * 保留底层的子树复用、DOM 提交时机和 props 惰性读取；上层不直接引用 Solid。
 *
 * 统一公开渲染、根作用域与 props 能力；内部计算和 owner 接入另归 reactivity。
 */
import { createMemo, omit as nativeOmit, type Merge } from 'solid-js'
import { isFunction } from '@edsolater/fnkit'
export {
  For,
  Show,
  Loading,
  Errored,
  children,
  mapArray,
  createComponent,
  createRoot,
} from 'solid-js'
export { render, insert } from '@solidjs/web'

/**
 * 使用原生过滤视图保留其余 Props 的惰性读取与声明形状。
 * 同一原生函数已支持 getter 输入，这里只补齐当前声明遗漏的重载。
 */
export const omitProps = nativeOmit as typeof nativeOmit & {
  <Props extends object, Key extends keyof Props>(
    props: () => Props,
    ...keys: Key[]
  ): Omit<Props, Key>
}

/** 高优先级 undefined 继续回退默认值，保持现有 props 合并契约。 */
export function mergeProps<T extends unknown[]>(...sources: T): Merge<T> {
  const readSources = sources.map((source) =>
    isFunction(source) ? createMemo(() => source() || {}) : () => source || {},
  )
  const hasProperty = (key: PropertyKey) =>
    readSources.some((read) => key in read())
  const readProperty = (key: PropertyKey) => {
    for (let index = readSources.length - 1; index >= 0; index--) {
      const value = readSources[index]()[key]
      if (value !== undefined) return value
    }
  }

  return new Proxy(
    {},
    {
      get: (_, key) => readProperty(key),
      has: (_, key) => hasProperty(key),
      ownKeys: () => [
        ...new Set(readSources.flatMap((read) => Reflect.ownKeys(read()))),
      ],
      getOwnPropertyDescriptor: (_, key) =>
        hasProperty(key)
          ? {
              enumerable: true,
              configurable: true,
              get: () => readProperty(key),
            }
          : undefined,
    },
  ) as Merge<T>
}
