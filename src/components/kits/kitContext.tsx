/** 在组件树中提供具名节点，供后代读取最近或指定祖先的数据。 */
import type { AnyRecord } from '@edsolater/fnkit'
import { createContext, useContext } from '@/foundation'

type KitName = string

export type KitContextNode =
  | { isRoot: true }
  | {
      isRoot: false
      name: KitName
      parent: KitContextNode
      payloads: AnyRecord
    }

/** 宿主 App 直接提供自己的根节点；未提供时沿用原生 Context 错误。 */
export const KitContextRoot = createContext<KitContextNode>()

/**
 * 为后代提供当前组件节点，初始化时连接父级。
 * 用法与设计见 [KitContext 规范](./kitContext.spec.md)。
 */
export const KitContext = (props: {
  children?: any
  name: KitName
  payloads: AnyRecord
}) => {
  const parent = useContext(KitContextRoot)
  const node: KitContextNode = {
    isRoot: false,
    name: props.name,
    parent,
    payloads: props.payloads,
  }
  return <KitContextRoot value={node}>{props.children}</KitContextRoot>
}

/**
 * 读取最近的匹配祖先；遇到 App 根时结束，未找到返回 undefined。
 * 用法见 [祖先查询](./kitContext.spec.md#祖先查询)。
 */
export function useKitContext<Payloads = AnyRecord>(
  query?: { target: KitName } | { payloadKey: string },
): Payloads | undefined {
  let node = useContext(KitContextRoot)
  while (!node.isRoot) {
    if (
      !query ||
      ('target' in query
        ? node.name === query.target
        : query.payloadKey in node.payloads)
    ) {
      return node.payloads
    }
    node = node.parent
  }
}
