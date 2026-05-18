import { createState, type State } from './base-state'
import { createMatch } from './value-state/matcher'

// 获得底层的DOM, 叫 DomRef 是习惯
export function createDomRef<T extends HTMLElement = HTMLElement>(): [
  el: State<T | undefined>,
  load: (el: T) => void,
  loaded: State<boolean>,
] {
  const [ref, setRef] = createState<T | undefined>(undefined, { mode: 'signal' })
  const loaded = createMatch(ref, (e) => e !== undefined)
  return [ref, setRef, loaded]
}
