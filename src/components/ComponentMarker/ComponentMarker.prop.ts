import type { ComponentDescriptionProps } from './ComponentMarker'
import type { PropsDefinition } from '../utils/componentPropsDirector'

/** 用途说明字段的运行时描述，由提供该 Props 协议的领域维护。 */
export const componentDescriptionPropsDefinition = {
  description: 'state-source-view',
  descriptionDisplay: 'state-value-view',
} satisfies PropsDefinition<ComponentDescriptionProps>
