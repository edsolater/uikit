import type { DodeDOMProps } from './Dode'
import type { PropsDefinition } from '../utils/componentPropsDirector'

/** DOM 字段的运行时读取描述，与本层拥有的 Props 契约保持同一归属。 */
export const dodeDOMPropsDefinition = {
  as: 'state-untracked',
  if: 'state-value-view',
  id: 'state-source-view',
  class: 'state-source-view',
  style: 'state-source-view',
  htmlProps: 'state-source-view',
  on: 'state-value-view',
  domRef: 'state-untracked',
  children: 'state-source-view',
} satisfies PropsDefinition<DodeDOMProps>
