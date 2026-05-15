/**
 * 组件库上下文，提供组件拿到上级组件【可指定】给出的context的payloads之能力。
 * 组件库里有些能力需要通过context在组件树里传递， 这个文件提供了一个通用的KitContext来满足这个需求。
 */
import type { AnyRecord } from '@edsolater/fnkit'
import { createContext, useContext } from 'solid-js'

type KitName = string

const KitContextRoot = createContext<KitContextNode | undefined>(undefined, { name: 'KitContext' })

type KitContextNode<Payloads = AnyRecord> = {
  name: KitName
  parent?: KitContextNode
  payloads: Payloads
}

/**
 * ! 给父组件用
 *
 * 组件库上下文提供者。
 * 组件根context能力
 *
 * 假设此组件为 Card
 * @example
 *
 * function Card(props) {
 * const [title, setTitle] = createState('miss <Title>')
 * return (<KitContext name="Card" payloads={{ setTitle }}>
 *   <Piv class="card">
 *     {props.children}
 *   </Piv>
 * </KitContext>)
 * }
 */
export const KitContext = (props: { children?: any } & Omit<KitContextNode, 'parent'>) => {
  const parent = useContext(KitContextRoot)
  return (
    <KitContextRoot.Provider value={{ name: props.name, parent, payloads: props.payloads }}>
      {props.children}
    </KitContextRoot.Provider>
  )
}

/**
 * ! 给子组件用
 * 
 * 读取上层 context 的 payloads能力附加到父组件的上下文里。
 *
 * 假设此时父组件是Card，子组件是Title， 那么在Title里调用这个函数，传入自己的信息，就能让Card的上下文里感知到Title的存在。
 * 这样Card就能根据上下文里有没有Title，来决定要不要渲染一个Title的容器，或者给Title容器注入一个不同的样式。
 * @example 在子组件中使用
 * @param query
 *  1.     ：第一种情况：不提供任何信息。直接找最近的。
 *  2. target: 第二种情况：提供组件名字。可以通过这个名字来查询到这个context的payloads。
 *  3. payloadKey：第三种情况：提供一个方法。找到最近的满足这个方法的context的payloads。
 *
 *
 *
 * function Title(props: { children: string }) {
 *  const CardContextPayloads = useKitContext({target: 'Card'})
 *  const text = props.children.trim()
 * 
 *  createEffect(() => {
 *    const text = props.children.trim()
 *    card?.setTitle?.(text)
 *    onCleanup(() => {
 *      card?.setTitle?.(undefined)
 *    })
 *  })
 *  return <Piv>Title here</Piv>
 * }
 */
export function useKitContext<Payloads = AnyRecord>(
  query?: { target: KitName } | { payloadKey: string },
): Payloads | undefined {
  let node: KitContextNode | undefined = useContext(KitContextRoot)

  // 向上遍历 context 链，找到第一个满足条件的节点。
  if (query && 'target' in query) {
    while (node) {
      if (node.name === query?.target) {
        break
      }
      node = node.parent
    }
  } else if (query && 'payloadKey' in query) {
    while (node) {
      if (query.payloadKey in node.payloads) {
        break
      }
      node = node.parent
    }
  }

  return node?.payloads
}
