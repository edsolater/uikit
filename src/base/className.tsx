import type { MayArray, MayFn } from '@edsolater/fnkit'
import type { Accessor } from 'solid-js'

type ClassLeaf = string | number | false | null | undefined

export type ClassName = MayArray<MayFn<ClassLeaf>>

/**
 * 把 class 语义压平成最终 className，保留数组与 accessor 的组合能力。
 */
export function resolveClassName(value: ClassName): string {
  if (Array.isArray(value)) {
    return value
      .map((item) => resolveClassName(item))
      .filter(Boolean)
      .join(' ')
  }

  if (typeof value === 'function') {
    return resolveClassName((value as Accessor<ClassName>)())
  }

  if (value == null || value === false) {
    return ''
  }

  return String(value)
}
