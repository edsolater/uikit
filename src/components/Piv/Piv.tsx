/**
 * 这个文件定义 Piv，项目里唯一真实 DOM 出口。
 * 它只负责按 as 选择原生 tag，并在 ref 阶段整合 plugin props，再连接 class、style、htmlProps、on 和 ref 消费者。
 * 它不负责具体组件外观、业务语义、主题系统或组件控制器抽象；这些应落在上层组件或对应 helper 文件。
 */
import { type MayArray, type ID } from '@edsolater/fnkit'
import { children, Show, type JSX, type JSXElement } from 'solid-js'
import { val, type Source } from '../../hooks'
import { consumeClassName, type ClassNameList } from './className'
import {
  domMap,
  type CreatePivElement,
  type ParsedPivProps,
  type PivHTMLElement,
  type PivSupportedElementTag,
  type PivTag,
} from './domMap'
import { consumeHTMLProps, type HTMLPropsList } from './handleHTMLProps'
import { consumeId } from './id'
import { type EventListeners } from './on/handleOn'
import { mergePivProps, type ShadowProps } from './plugin/handlePivPlugin'
import { type PivPlugin } from './plugin/runPlugin'
import { consumeEventListeners } from './on/registerEventListeners'
import { consumeStyle, type StyleList } from './handleStyle'
import { parseNormalRefs, type PivRef } from './ref'

export type PivProps<Tag extends PivTag = 'div'> = {
  /**
   * 代表这个Piv的身份模板， 默认为div
   * （元能力，只可用显式定义，不可被plugin系自动修改）
   */
  as?: Tag

  /**
   * false 时 Piv 自身和 children 都不进入 DOM。
   * （元能力，只可用显式定义，不可被plugin系自动修改）
   */
  if?: Source<boolean>

  /**
   * 真实 DOM 的全局身份。
   * 可以是响应值或列表，并沿用 Piv 的普通 props 合并规则。
   */
  id?: Source<MayArray<ID> | undefined>

  /**
   * 上层组件转交给当前 Piv 的低优先级 props。
   * 它沿用 plugin props 整合规则，当前 Piv 的直接 props 始终拥有更高优先级。
   */
  shadowProps?: MayArray<ShadowProps<Tag>>

  /**
   * Piv 的底层扩展入口。plugin 可以使用当前 DOM，并返回一层低优先级 props。
   * 返回 undefined 表示这个 plugin 只执行结构能力，不补充 props。
   */
  plugins?: MayArray<PivPlugin<Tag>>

  /**
   * plugin 的语义化 alias，用来表达稳定能力或性质。
   */
  trait?: MayArray<PivPlugin<Tag>>

  /**
   * class 声明。支持字符串、列表、条件对象和 Source，并与各 plugin 来源共同合并。
   */
  class?: ClassNameList

  /**
   * DOM style 特殊项。支持普通 style、列表或整体 Source，并按 CSS 字段细粒度订阅。
   */
  style?: StyleList

  /**
   * 普通原生 HTML 字段，以及 attr: / prop: 显式落点；记录整体和单字段都可以使用 Source。
   * class、style、事件、children 和 ref 使用各自的专用入口，不进入这里。
   */
  htmlProps?: HTMLPropsList<Tag>

  /**
   * 事件，dom:onXXX
   */
  on?: EventListeners

  /**
   * 获取真实 DOM 的命令式逃生口；声明式需求应优先使用 class、style、htmlProps 或 on。
   */
  ref?: PivRef<Tag>

  /** 子内容既可以是普通 JSX，也可以是整体可替换的 StateView。 */
  children?: Source<JSXElement>
}

/**
 * Piv 是一切组件的基石
 * 它的props都是元能力props
 */
export function Piv<Tag extends PivSupportedElementTag = 'div'>(rawProps: PivProps<Tag>): JSX.Element {
  // --------------------- 处理 as，默认 div ---------------------
  const jsxCreator = domMap[rawProps.as ?? 'div'] as CreatePivElement<Tag>
  /**
   * Piv 会把 children 再传给 domMap，因此这里保留可重复读取的响应式来源，
   * 避免中间对象把动态文本或动态结构固化成首次渲染快照。
   */
  const resolvedChildren = children(() => val(rawProps.children))

  const parsedProps: ParsedPivProps<Tag> = {
    richRef: (element: PivHTMLElement<Tag>) => {
      const props = mergePivProps(element, rawProps)

      consumeId(element, () => props.id)

      consumeClassName(element, () => props.class)

      consumeStyle(element, () => props.style)

      const on = props.on
      if (on) {
        consumeEventListeners(element, on)
      }

      consumeHTMLProps<Tag>(element, () => props.htmlProps)

      const ref = props.ref
      if (ref) {
        parseNormalRefs(element, ref)
      }
    },

    children: resolvedChildren,
  }

  if (rawProps.if !== undefined) {
    return <Show when={val(rawProps.if)}>{jsxCreator(parsedProps)}</Show>
  } else {
    return jsxCreator(parsedProps)
  }
}
