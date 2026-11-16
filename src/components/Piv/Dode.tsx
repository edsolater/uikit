/**
 * Dode 是元素声明的执行者。
 *
 * 处理创建时的 as、按需启用的 if，以及 DOM 字段绑定。
 *
 * 来源和插件已由 Piv 在创建前组织，绑定归所属存活作用域，显隐不增加 DOM 层。
 */
import { toArray, type ID, type MayArray } from '@edsolater/fnkit'
import {
  type JSX,
  type JSXElement,
  type Source,
  createRenderEffect,
  createComponent,
  useContext,
  val,
} from '@/foundation'
import { children, insert, mapArray } from '@/foundation/render'
import { getOwner, runWithOwner, untrack } from '@/foundation/reactivity'

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
import { ElementDeclarationsContext } from './elementDeclarations'
import { toEventListenersList, type EventListeners } from './on/handleOn'
import { consumeEventListeners } from './on/registerEventListeners'
import { consumeDomRefs, type PivDomRef } from './domRef'

/** 底层 DOM 声明契约；Piv 组合该契约，不重复定义或解析字段。 */
export type DodeDOMProps<Tag extends PivTag = 'div'> = {
  /** 首次创建时确定元素类型，默认 div；之后保持固定。 */
  as?: Tag
  /** 属性存在时启用条件显隐；首次显示创建一次，之后复用同一元素。 */
  if?: Source<boolean>
  /** 全局身份，支持 Source 与列表，并沿来源合并规则形成稳定 Source。 */
  id?: Source<MayArray<ID> | undefined>
  /** 字符串、列表、条件 token 对象或整体 Source。 */
  class?: ClassNameList
  /**
   * 底层 CSS 逃生舱，接受普通 style、列表或整体 Source，按字段订阅。
   * 不推荐作为常规组件样式入口；优先在组件 .style.ts 定义样式，通过组件的 styleConfig 表达必要差异。
   * 仅在组件样式能力无法满足必要需求时，作为最后手段使用。
   */
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
 * 按显示来源创建并切换节点，首次显示后保持同一真实元素及其类型。
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
  const owner = getOwner()
  let element: JSX.Element
  /**
   * 首次显示时将元素和绑定归入 Dode 的存活作用域，显隐不重建或清理它们。
   */
  const getOrCreateElement = () =>
    (element ??= runWithOwner(owner, () =>
      createDodeElement(
        domMap[
          (props.as ?? 'div') as PivSupportedElementTag
        ] as CreatePivElement<Tag>,
        props,
      ),
    ))
  return <>{val(props.if) ? getOrCreateElement() : null}</>
}

/**
 * 创建裸元素，接回管理层声明并完成字段、引用和子内容的初始化。
 */
function createDodeElement<Tag extends PivTag>(
  createElement: CreatePivElement<Tag>,
  props: DodeDOMProps<Tag>,
): JSX.Element {
  const declarations = useContext(ElementDeclarationsContext)
  // 根声明在真实元素处消费，子内容只接收自己所属组件的声明。
  const resolvedChildren = children(() =>
    createComponent(ElementDeclarationsContext, {
      value: [],
      get children() {
        return val(props.children)
      },
    }),
  )
  const element = createElement()
  consumeId(element, props.id)
  consumeClassName(element, () => props.class)
  consumeStyle(element, () => [
    ...declarations.flatMap((declaration) => toArray(val(declaration.style))),
    ...toArray(val(props.style)),
  ])
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
  consumeHTMLProps<Tag>(element, () => [
    ...declarations.flatMap((declaration) =>
      toArray(val(declaration.htmlProps)),
    ),
    ...toArray(val(props.htmlProps)),
  ])
  // domRef 按声明身份接入；相同声明不因旁读重跑，插件声明变化时接入新项并释放旧项。
  consumeDomRefs(element, () => props.domRef)
  // 四种模板原本不消费 children，保持既有行为，包括 textarea 与 iframe。
  if (!['input', 'textarea', 'img', 'iframe'].includes(element.localName)) {
    insert(element, resolvedChildren)
  }
  return element
}
