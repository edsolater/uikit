/**
 * Dode 是元素声明的执行者。
 *
 * 处理创建时的 as、按需启用的 if，以及 DOM 字段绑定。
 *
 * 来源和插件已由 Piv 在创建前组织，所有绑定归当前元素分支，不增加 DOM 层。
 */
import type { ID, MayArray } from '@edsolater/fnkit'
import {
  type JSX,
  type JSXElement,
  type Source,
  createRenderEffect,
  Show,
  val,
} from '@/foundation'
import { children, insert, mapArray } from '@/foundation/render'
import { untrack } from '@/foundation/reactivity'

import { consumeClassName, type ClassNameList } from './className'
import {
  domMap,
  type CreatePivElement,
  type PivSupportedElementTag,
  type PivTag,
} from './domMap'
import { consumeHTMLProps, type HTMLPropsList } from './handleHTMLProps'
import { consumeStyle, type StyleList } from './handleStyle'
import { consumeId } from './id'
import { toEventListenersList, type EventListeners } from './on/handleOn'
import { consumeEventListeners } from './on/registerEventListeners'
import { consumeDomRefs, type PivDomRef } from './domRef'

/** 底层 DOM 声明契约；Piv 组合该契约，不重复定义或解析字段。 */
export type DodeDOMProps<Tag extends PivTag = 'div'> = {
  /** 首次创建时确定元素类型，默认 div；之后保持固定。 */
  as?: Tag
  /** 属性存在时启用 Show；undefined 也表示条件不满足。 */
  if?: Source<boolean>
  /** 全局身份，支持 Source 与列表，并沿来源合并规则形成稳定 Source。 */
  id?: Source<MayArray<ID> | undefined>
  /** 字符串、列表、条件 token 对象或整体 Source。 */
  class?: ClassNameList
  /** 普通 style、列表或整体 Source，按 CSS 字段订阅。 */
  style?: StyleList
  /** 原生 HTML 字段和 attr:/prop:；不接管专用 class/style/on/domRef/children。 */
  htmlProps?: HTMLPropsList<Tag>
  /** DOM 事件声明，按原始声明身份拥有监听生命周期。 */
  on?: EventListeners
  /** 初始化字段后取得真实 DOM 的命令式入口。 */
  domRef?: PivDomRef<Tag>
  /** 普通 JSX 或整体可替换的 Source。 */
  children?: Source<JSXElement>
}

/**
 * 按 if 是否声明选择条件分支，首次实际创建时固定元素类型。
 */
export function Dode<Tag extends PivTag>(
  props: DodeDOMProps<Tag>,
): JSX.Element {
  if (!untrack(() => 'if' in props)) {
    return createDodeElement(
      domMap[
        untrack(() => props.as ?? 'div') as PivSupportedElementTag
      ] as CreatePivElement<Tag>,
      props,
    )
  }
  let jsxCreator: CreatePivElement<Tag> | undefined
  /**
   * 保留首次实际创建的元素类型，条件重开时使用同一工厂。
   */
  const createElement = () => {
    jsxCreator ??= domMap[
      untrack(() => props.as ?? 'div') as PivSupportedElementTag
    ] as CreatePivElement<Tag>
    return jsxCreator()
  }
  return (
    <Show when={val(props.if)}>
      <DodeElement createElement={createElement} props={props} />
    </Show>
  )
}

/**
 * 为条件分支提供自然组件边界，隔离绑定初始化的旁读。
 */
function DodeElement<Tag extends PivTag>(input: {
  createElement: CreatePivElement<Tag>
  props: DodeDOMProps<Tag>
}): JSX.Element {
  return createDodeElement(input.createElement, input.props)
}

/**
 * 创建裸元素，接回管理层声明并完成字段、引用和子内容的初始化。
 */
function createDodeElement<Tag extends PivTag>(
  createElement: CreatePivElement<Tag>,
  props: DodeDOMProps<Tag>,
): JSX.Element {
  const resolvedChildren = children(() => val(props.children))
  const element = createElement()
  consumeId(
    element,
    untrack(() => props.id),
  )
  consumeClassName(element, () => props.class)
  consumeStyle(element, () => props.style)
  // 原始声明身份决定监听作用域，其他能力变化不会重置 once 或提前执行其 cleanup。
  mapArray(
    () => toEventListenersList(props.on),
    (declaration) => {
      createRenderEffect(declaration, (eventDeclaration) =>
        consumeEventListeners(element, eventDeclaration),
      )
      return declaration
    },
  )
  consumeHTMLProps(element, () => props.htmlProps)
  // domRef 按声明身份接入；相同声明不因旁读重跑，插件声明变化时接入新项并释放旧项。
  consumeDomRefs(element, () => props.domRef)
  // 四种模板原本不消费 children，保持既有行为，包括 textarea 与 iframe。
  if (!['input', 'textarea', 'img', 'iframe'].includes(element.localName)) {
    insert(element, resolvedChildren)
  }
  return element
}
