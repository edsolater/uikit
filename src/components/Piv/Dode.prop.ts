/**
 * Dode 原生节点输入的读取协议。
 *
 * 区分创建时固定的标签与持续消费的字段、事件和节点引用。
 *
 * 上层 Kit 复用这份协议，不另行定义原生节点的控制方式。
 */
import type { DodeDOMProps } from './Dode'
import type { PropsDefinition } from '../tools/componentPropsDirector'

/** DOM 字段的运行时读取描述，与本层拥有的 Props 契约保持同一归属。 */
export const dodeDOMPropsDefinition = {
  as: 'state-untracked',
  if: 'state-value-view',
  id: 'state-source-view',
  class: 'state-source-view',
  style: 'state-source-view',
  htmlProps: 'state-source-view',
  on: 'state-value-view',
  domRef: 'state-value-view',
  children: 'state-source-view',
} satisfies PropsDefinition<DodeDOMProps>
