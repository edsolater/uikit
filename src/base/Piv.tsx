/**
 * 这个文件只定义唯一真实 DOM 出口 Piv，负责创建和绑定原生元素。
 * 它不负责业务语义、主题系统、结构包装或组件控制器抽象。
 */
import { type MayArray } from '@edsolater/fnkit'
import { type Accessor, type JSX } from 'solid-js'
import { classname, type ClassName } from './pivHelpers/className'
import {
  domMap,
  type ParsedPivProps,
  type PivElement,
  type PivSupportedElementTag,
  type PivTag,
} from './pivHelpers/domMap'
import { fromProps2Ref } from './pivHelpers/ref'
import type { PivPlugin } from './pivHelpers/pivPlugin'
import type { PivChild } from './pivHelpers/pivChild'
import type { Events } from './pivHelpers/events'

export type RefFunction<T extends Element> = (element?: T) => void

export type PivDomProps = Record<string, unknown | Accessor<unknown>>


export type PivProps<Tag extends PivTag = 'div'> = {
  as?: Tag

  /**
   * CSS 共同项， dom:class
   */
  class?: ClassName

  domProps?: PivDomProps

  /**
   * 事件， dom:onXXX
   */
  events?: Events
  plugins?: MayArray<PivPlugin>
  ref?: MayArray<RefFunction<PivElement<Tag>> | undefined>
  children?: PivChild
}

/**
 * Piv 是一切组件的基石
 * 它的props都是元能力props
 */
export function Piv<Tag extends PivSupportedElementTag = 'div'>(inputProps: PivProps<Tag>): JSX.Element {
  const creator = domMap[inputProps.as ?? 'div']
  const parsedProps: ParsedPivProps<Tag> = {
    class: inputProps.class != null ? classname(inputProps.class) : undefined,
    richRef: (element: PivElement<Tag>) => fromProps2Ref(element, inputProps),
    children: inputProps.children,
  }
  return creator(parsedProps)
}
