import type { PublicCapabilityProps } from './publicCapabilities'
import type { DefaultPropSources, PropsDefinition } from '../../utils/componentPropsDirector'

/** 快捷能力的字段描述及可干预入口，供继承该 Props 协议的组件组合。 */
export const publicCapabilityPropsDefinition = {
  draggable: 'state-source-view',
  droppable: 'state-source-view',
} satisfies PropsDefinition<PublicCapabilityProps>

const emptyCapabilitySource = () => undefined
export const publicCapabilityDefaultSources = {
  draggable: emptyCapabilitySource,
  droppable: emptyCapabilitySource,
} satisfies DefaultPropSources<PublicCapabilityProps, typeof publicCapabilityPropsDefinition>
