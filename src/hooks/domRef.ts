import { createState, type StateView, type State } from '@/foundation'

// 获得底层的DOM, 叫 DomRef 是习惯
export function createDomRef<T extends HTMLElement = HTMLElement>(): [
  el: State<Awaited<T> | undefined>,
  load: (el: T) => void,
  loaded: StateView<boolean>,
]
export function createDomRef(): [
  el: State<HTMLElement | undefined>,
  load: (el: HTMLElement) => void,
  loaded: StateView<boolean>,
] {
  // DOM ref 在组件构建阶段同步登记；此专用状态允许注册写入，保留 ref 先于 children/mount 的顺序。
  const ref = createState<HTMLElement | undefined>(undefined, { ownedWrite: true })
  const loaded = ref.map((element) => element !== undefined)
  return [ref, (element) => ref.set(element), loaded]
}
