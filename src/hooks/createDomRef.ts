import { createRef } from './createRef'

/** 创建原生元素的直接引用与 domRef 接收器，元素退出时释放引用。 */
export function createDomRef<T extends HTMLElement = HTMLElement>() {
  return createRef<T>()
}
