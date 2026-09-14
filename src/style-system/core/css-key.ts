/** 可复用的 CSS 属性名。 */

export interface Key<K extends string = string> {
  name: K
}

export function key<const K extends string>(name: K): Key<K> {
  return { name }
}
