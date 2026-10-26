/**
 * Dode 执行已经确定的元素创建与 DOM 绑定，不解释 Piv 的 if/as、来源优先级或插件能力。
 * 管理者在真实元素可用时提供最终绑定材料；所有绑定归属于当前元素分支，不增加 DOM 层。
 */
import type { ID, MayArray } from '@edsolater/fnkit'
import {
  type JSX,
  type JSXElement,
  type Source,
  createRenderEffect,
  val,
} from '@/foundation'
import { children, insert, mapArray } from '@/foundation/render'
import { untrack } from '@/foundation/reactivity'

import { consumeClassName, type ClassNameList } from './className'
import type { CreatePivElement, PivHTMLElement, PivTag } from './domMap'
import { consumeHTMLProps, type HTMLPropsList } from './handleHTMLProps'
import { consumeStyle, type StyleList } from './handleStyle'
import { consumeId } from './id'
import { toEventListenersList, type EventListeners } from './on/handleOn'
import { consumeEventListeners } from './on/registerEventListeners'
import { parseNormalRefs, type PivRef } from './ref'

/** 底层 DOM 声明契约；Piv 组合该契约，不重复定义或解析字段。 */
export type DodeDOMProps<Tag extends PivTag = 'div'> = {
  /** 全局身份，支持 Source 与列表，并沿来源合并规则形成稳定 Source。 */
  id?: Source<MayArray<ID> | undefined>
  /** 字符串、列表、条件 token 对象或整体 Source。 */
  class?: ClassNameList
  /** 普通 style、列表或整体 Source，按 CSS 字段订阅。 */
  style?: StyleList
  /** 原生 HTML 字段和 attr:/prop:；不接管专用 class/style/on/ref/children。 */
  htmlProps?: HTMLPropsList<Tag>
  /** DOM 事件声明，按原始声明身份拥有监听生命周期。 */
  on?: EventListeners
  /** 初始化字段后取得真实 DOM 的命令式入口。 */
  ref?: PivRef<Tag>
  /** 普通 JSX 或整体可替换的 Source。 */
  children?: Source<JSXElement>
}

type DodeProps<Tag extends PivTag> = {
  createElement: CreatePivElement<Tag>
  children: DodeDOMProps<Tag>['children']
  setup: (element: PivHTMLElement<Tag>) => Omit<DodeDOMProps<Tag>, 'children'>
}

export function Dode<Tag extends PivTag>(props: DodeProps<Tag>): JSX.Element {
  const resolvedChildren = children(() => val(props.children))
  const element = props.createElement()
  const bindings = props.setup(element)
  consumeId(element, bindings.id)
  consumeClassName(element, () => bindings.class)
  consumeStyle(element, () => bindings.style)
  // 原始声明身份决定监听作用域，其他能力变化不会重置 once 或提前执行其 cleanup。
  mapArray(
    () => toEventListenersList(bindings.on),
    (declaration) => {
      createRenderEffect(declaration, (eventDeclaration) =>
        consumeEventListeners(element, eventDeclaration),
      )
      return declaration
    },
  )
  consumeHTMLProps(element, () => bindings.htmlProps)
  // 普通 ref 只在元素初始化时读取，不随插件配置变化重复执行。
  const refs = untrack(() => bindings.ref)
  if (refs) parseNormalRefs(element, refs)
  // 四种模板原本不消费 children，保持既有行为，包括 textarea 与 iframe。
  if (!['input', 'textarea', 'img', 'iframe'].includes(element.localName)) {
    insert(element, resolvedChildren)
  }
  return element
}
