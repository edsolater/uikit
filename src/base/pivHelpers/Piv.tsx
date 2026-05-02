/**
 * 这个文件定义 Piv，项目里唯一真实 DOM 出口。
 * 它只负责按 as 选择原生 tag，并在 ref 阶段按 plugin 合并结果消费 class、style、htmlProps、on 和 ref。
 * 它不负责具体组件外观、业务语义、主题系统或组件控制器抽象；这些应落在上层组件或对应 helper 文件。
 */
import { type MayArray } from '@edsolater/fnkit'
import { type JSX } from 'solid-js'
import { consumeClassName, type PivClassNameProp } from './className'
import {
  domMap,
  type CreatePivElement,
  type ParsedPivProps,
  type PivSupportedElementTag,
  type PivTag,
  type PivHTMLElement,
} from './domMap'
import { consumeHTMLProps, type HTMLPropsList } from './handleHTMLProps'
import { consumeEventListeners, type EventListeners } from './handleOn'
import { consumePivPlugins, mergeShadowPropsToPivProps, type PivPlugin } from './handlePivPlugin'
import { consumeStyle, type StyleList } from './handleStyle'
import { parseNormalRefs, type PivRef } from './ref'

// TODO: 必须支持所有的可设置assessor，不然更新的，细粒度就不够细了
export type PivProps<Tag extends PivTag = 'div'> = {
  /**
   * 代表这个Piv的身份模板， 默认为div
   */
  as?: Tag

  /**
   * 特殊prop：定义时插件， 其返回值（返回undefined时忽略）能合并入其下方的其他props
   */
  plugins?: MayArray<PivPlugin<Tag>>

  /**
   * CSS 共同项， dom:class
   */
  class?: PivClassNameProp

  /**
   * DOM style 特殊项，按 CSS 字段合并并细粒度订阅。
   */
  style?: StyleList

  /**
   * attrs 或 props，自动判断
   */
  htmlProps?: HTMLPropsList<Tag>

  /**
   * 事件，dom:onXXX
   */
  on?: EventListeners

  /**
   * ref 是逃生出口，因为可以拿到DOM， 其他props本质上就是它的一个快捷方式罢了。（除了as以及plugin的返回值）
   */
  ref?: PivRef<Tag>

  /* 可以结构化穿透 */
  children?: JSX.Element
}

/**
 * Piv 是一切组件的基石
 * 它的props都是元能力props
 */
export function Piv<Tag extends PivSupportedElementTag = 'div'>(inputProps: PivProps<Tag>): JSX.Element {
  const creator = domMap[inputProps.as ?? 'div'] as CreatePivElement<Tag>
  const parsedProps: ParsedPivProps<Tag> = {
    richRef: (element: PivHTMLElement<Tag>) => {
      // 因为plugins是唯一可以更改prompt的，虽然优先级最低，所以它需要在其他props前处理。
      const shadowPropsList = consumePivPlugins(element, inputProps.plugins)
      const parsedPivProps: PivProps<Tag> = mergeShadowPropsToPivProps(shadowPropsList, inputProps)

      if (parsedPivProps.class) {
        consumeClassName(element, parsedPivProps.class)
      }

      if (parsedPivProps.htmlProps) {
        consumeHTMLProps<Tag>(element, parsedPivProps.htmlProps)
      }

      if (parsedPivProps.style) {
        consumeStyle(element, parsedPivProps.style)
      }

      if (parsedPivProps.on) {
        consumeEventListeners(element, parsedPivProps.on)
      }

      if (parsedPivProps.ref) {
        parseNormalRefs(element, parsedPivProps.ref)
      }
    },

    children: inputProps.children,
  }
  return creator(parsedProps)
}
