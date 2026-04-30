import type { Accessor } from 'solid-js'

type ClassLeaf = string | number | false | null | undefined
interface ClassList extends ReadonlyArray<ClassValue> {}
interface ClassAccessor {
  (): ClassValue
}

export type ClassValue = ClassLeaf | ClassList | ClassAccessor

/**
 * 把 class 语义压平成最终 className，保留数组与 accessor 的组合能力。
 */
export function resolveClassValue(value: ClassValue): string {
  if (Array.isArray(value)) {
    return value
      .map((item) => resolveClassValue(item))
      .filter(Boolean)
      .join(' ')
  }

  if (typeof value === 'function') {
    return resolveClassValue((value as Accessor<ClassValue>)())
  }

  if (value == null || value === false) {
    return ''
  }

  return String(value)
}
