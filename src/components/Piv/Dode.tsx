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
  onCleanup,
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
import { consumeHTMLProps, type HTMLPropsList } from './html-props'
import { consumeStyle, type StyleList } from './style-binding'
import { consumeId } from './id'
import { ElementDeclarationsContext } from './elementDeclarations'
import {
  toEventListenersList,
  type EventListeners,
} from './on/event-declarations'
import { consumeEventListeners } from './on/event-listeners'
import { consumeDomRefs, type PivDomRef } from './domRef'

/** 底层 DOM 声明契约；Piv 组合该契约，不重复定义或解析字段。 */
export type DodeDOMProps<Tag extends PivTag = 'div'> = {
  /** 首次创建时确定元素类型，默认 div；之后保持固定。 */
  as?: Tag
  /** 属性存在时启用条件显隐；首次显示创建一次，之后复用同一元素。 */
  if?: Source<boolean>
  /** 全局身份，支持 Source 与列表，沿来源合并规则消费。 */
  id?: Source<MayArray<ID> | undefined>
  /** 字符串、列表、条件 token 对象或整体 Source。 */
  class?: ClassNameList
  /**
   * 底层 CSS 逃生舱，接受普通 style、列表或整体 Source，按字段订阅。
   * 不推荐作为常规组件样式入口；优先在组件 .style.ts 定义样式，通过美元属性表达必要差异。
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

/** 字段绑定顺序先完成原生状态，再交付引用，最后插入子内容。 */
const domFields = [
  'id',
  'class',
  'style',
  'on',
  'htmlProps',
  'domRef',
  'children',
] as const
// 这四种模板沿原契约不消费 children，标签固定后无需重复判断。
const ignoredChildrenTags = ['input', 'textarea', 'img', 'iframe']

/**
 * 创建裸元素，接回管理层声明并完成字段、引用和子内容的初始化。
 */
function createDodeElement<Tag extends PivTag>(
  createElement: CreatePivElement<Tag>,
  props: DodeDOMProps<Tag>,
): JSX.Element {
  const declarations = useContext(ElementDeclarationsContext)
  const element = createElement()
  // 管理层声明在前、节点声明在后；消费时逐源检查字段，避免读取未声明的受控或 Token getter。
  const rootSources = [...declarations, props]
  const consumesChildren = !ignoredChildrenTags.includes(element.localName)
  // 空输入仍会创建消费者的 memo／列表作用域；在共同入口按声明筛选，才能真正省去整条绑定链。
  mapArray(
    () =>
      domFields.filter(field => {
        if (field === 'children' && !consumesChildren) return false
        return (
          field in props ||
          ((field === 'style' || field === 'htmlProps') &&
            declarations.some(declaration => field in declaration))
        )
      }),
    field => {
      switch (field) {
        case 'id':
          consumeId(element, () => props.id)
          break
        case 'class':
          consumeClassName(element, () => props.class)
          break
        case 'style':
          consumeStyle(element, () =>
            rootSources.flatMap(source =>
              'style' in source ? toArray(val(source.style)) : [],
            ),
          )
          break
        case 'on':
          // 原始声明身份拥有监听作用域，其他字段变化不重置 once 或提前清理监听。
          mapArray(
            () => toEventListenersList(props.on),
            declaration => {
              createRenderEffect(declaration, eventDeclaration =>
                consumeEventListeners(element, eventDeclaration),
              )
              return declaration
            },
          )
          break
        case 'htmlProps':
          consumeHTMLProps<Tag>(element, () =>
            rootSources.flatMap(source =>
              'htmlProps' in source ? toArray(val(source.htmlProps)) : [],
            ),
          )
          break
        case 'domRef':
          consumeDomRefs(element, () => props.domRef)
          break
        case 'children': {
          // 根声明止于真实元素；子内容使用自己的声明，字段退出时同时撤下已插入节点。
          const resolved = children(() =>
            createComponent(ElementDeclarationsContext, {
              value: [],
              get children() {
                return val(props.children)
              },
            }),
          )
          onCleanup(() => element.replaceChildren())
          insert(element, resolved)
          break
        }
      }
      return field
    },
  )
  return element
}
