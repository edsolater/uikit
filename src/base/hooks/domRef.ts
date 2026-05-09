import { createState, type State } from './base-state'

// 获得底层的DOM, 叫 DomRef 是习惯
export function createDomRef<T extends HTMLElement = HTMLElement>(): [State<T | undefined>, (el: T | undefined) => void] {
  const [ref, setRef] = createState<T | undefined>(undefined, { mode: 'signal' })
  return [ref, setRef]
}
