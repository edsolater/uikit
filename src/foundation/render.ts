/**
 * Solid 渲染与 props 接入的内部边界。
 *
 * 保留底层的子树复用、DOM 提交时机和 props 惰性读取；上层不直接引用 Solid。
 *
 * 本入口不通过包根发布，组件与应用挂载实现按需使用。
 */
import { omit, type Merge } from 'solid-js'
export { For, Show, children, mapArray, createMemo } from 'solid-js'
export { createRenderEffect } from './createEffect'
export { getOwner, runWithOwner } from 'solid-js'
export { render, insert } from '@solidjs/web'

/** 仅切分属性访问，不读取当前值，继续保留 getter。 */
export function splitProps<T extends object, K extends keyof T>(props: T, keys: K[]): [Pick<T, K>, Omit<T, K>] {
  const selected = Object.create(null)
  for (const key of keys) {
    Object.defineProperty(selected, key, { enumerable: true, get: () => props[key] })
  }
  return [selected, omit(props, ...keys) as unknown as Omit<T, K>]
}

/** 高优先级 undefined 继续回退默认值，保持现有 props 合并契约。 */
export function mergeProps<T extends unknown[]>(...sources: T): Merge<T> {
  return new Proxy({}, {
    get(_, key) {
      for (let index = sources.length - 1; index >= 0; index--) {
        const value = (sources[index] as Record<PropertyKey, unknown>)[key]
        if (value !== undefined) return value
      }
    },
    has: (_, key) => sources.some(source => key in (source as object)),
    ownKeys: () => [...new Set(sources.flatMap(source => Reflect.ownKeys(source as object)))],
    getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
  }) as Merge<T>
}
