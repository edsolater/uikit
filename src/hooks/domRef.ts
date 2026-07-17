import { createState, type StateView, type State } from './createState'

// 获得底层的DOM, 叫 DomRef 是习惯
export function createDomRef<T extends HTMLElement = HTMLElement>(): [
  el: State<T | undefined>,
  load: (el: T) => void,
  loaded: StateView<boolean>,
] {
  const ref = createState<T | undefined>(undefined)
  const loaded = ref.map((element) => element !== undefined)
  return [ref, (element) => ref.set(element), loaded]
}
