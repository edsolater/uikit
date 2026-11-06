/** 保存组件公开对象的引用，接收器返回的清理函数在实例退出时释放引用。 */
import { createState } from '@/foundation'
import { bindThisIfFunction } from '@edsolater/fnkit'

/** 组件通过 ref 交付公开对象；接收方可返回实例退出时的清理动作。 */
export type RefReceiver<T> = (value: T) => void | (() => void)

/**
 * 创建稳定的组件引用及接收器，直接通过引用访问当前 Controller 的能力。
 * 尚未接入或已退出时，各属性为 undefined；方法通过可选调用使用。
 * 属性赋值转发到已接入的对象，方法及属性访问保留该对象的 this。
 * @example
 * const [button, receiveButton] = createRef<ButtonController>()
 * // <Button ref={receiveButton}>保存</Button>
 * // 在事件中干预输入：button.props?.loading.set(true)
 * // 或使用组件能力：button.setStatus?.('loading', true)
 * // 原生元素使用独立的 createDomRef 与 domRef 属性。
 */
export function createRef<T extends object>(): [
  reference: Partial<T>,
  receive: RefReceiver<any>,
] {
  // 引用保存的是原对象本身；显式装入字段，避免把 StateView 对象当作值来源展开。
  const reference = createState<{ controller: T } | undefined>(undefined, { ownedWrite: true })
  const proxy = new Proxy({} as Partial<T>, {
    get(_, key) {
      const controller = reference.read()?.controller
      if (!controller) return undefined
      const value = Reflect.get(controller, key, controller)
      return bindThisIfFunction(value, controller)
    },
    set(_, key, value) {
      const controller = reference.read()?.controller
      return controller
        ? Reflect.set(controller, key, value, controller)
        : false
    },
  })
  return [
    proxy,
    (value) => {
      reference.set({ controller: value })
      return () => {
        reference.set(undefined)
      }
    },
  ]
}
