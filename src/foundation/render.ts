/**
 * Solid 渲染与 props 接入的内部边界。
 *
 * 保留底层的子树复用、DOM 提交时机和 props 惰性读取；上层不直接引用 Solid。
 *
 * 本入口不通过包根发布，组件与应用挂载实现按需使用。
 */
import { createMemo, type Merge } from 'solid-js'
import { isFunction } from '@edsolater/fnkit'
export { For, Show, Loading, Errored, children, mapArray, createMemo } from 'solid-js'
export { createRenderEffect } from './createEffect'
export { getOwner, runWithOwner, untrack } from 'solid-js'
export { render, insert } from '@solidjs/web'

/** 高优先级 undefined 继续回退默认值，保持现有 props 合并契约。 */
export function mergeProps<T extends unknown[]>(...sources: T): Merge<T> {
  const readSources = sources.map(source => isFunction(source)
    ? createMemo(() => source() || {})
    : () => source || {})
  const hasProperty = (key: PropertyKey) => readSources.some(read => key in read())
  const readProperty = (key: PropertyKey) => {
    for (let index = readSources.length - 1; index >= 0; index--) {
      const value = readSources[index]()[key]
      if (value !== undefined) return value
    }
  }

  return new Proxy({}, {
    get: (_, key) => readProperty(key),
    has: (_, key) => hasProperty(key),
    ownKeys: () => [...new Set(readSources.flatMap(read => Reflect.ownKeys(read())))],
    getOwnPropertyDescriptor: (_, key) => hasProperty(key)
      ? { enumerable: true, configurable: true, get: () => readProperty(key) }
      : undefined,
  }) as Merge<T>
}
