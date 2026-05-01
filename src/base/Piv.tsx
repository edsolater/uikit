/**
 * 这个文件只定义唯一真实 DOM 出口 Piv，负责创建和绑定原生元素。
 * 它不负责业务语义、主题系统、结构包装或组件控制器抽象。
 */
import { type MayArray } from '@edsolater/fnkit'
import { type JSX } from 'solid-js'
import { classname, type ClassName, type PivClassNameProp } from './pivHelpers/className'
import {
  domMap,
  type ParsedPivProps,
  type PivSupportedElementTag,
  type PivTag,
  type PivHTMLElement,
} from './pivHelpers/domMap'
import { consumeHTMLProps, type HTMLPropsList } from './pivHelpers/handleHTMLProps'
import { consumeEventListeners, type EventListeners } from './pivHelpers/handleOn'
import { consumePivPlugins, mergeShadowPropsToPivProps, type PivPlugin } from './pivHelpers/handlePivPlugin'
import { parseNormalRefs, type PivRef } from './pivHelpers/ref'
import type { AccessablePropValueWrapper, PropValueWrapper } from './type'

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
   * attrs 或 props，自动判断
   */
  htmlProps?: HTMLPropsList

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
  const creator = domMap[inputProps.as ?? 'div']
  const parsedProps: ParsedPivProps<Tag> = {
    class: inputProps.class != null ? classname(inputProps.class) : undefined,

    richRef: (element: PivHTMLElement<Tag>) => {
      // 因为plugins是唯一可以更改prompt的，虽然优先级最低，所以它需要在其他props前处理。
      const shadowPropsList = consumePivPlugins(element, inputProps.plugins)
      const parsedPivProps: PivProps<Tag> = mergeShadowPropsToPivProps(shadowPropsList, inputProps)

      if (parsedPivProps.htmlProps) {
        consumeHTMLProps<Tag>(element, parsedPivProps.htmlProps)
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
