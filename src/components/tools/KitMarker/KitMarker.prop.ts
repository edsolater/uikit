/**
 * 组件用途说明的字段协议。
 *
 * 用途与定位显示的读取事实由 Marker 领域声明。
 *
 * Kit 的公共表组合这些事实，不重复维护模式。
 */
import type { ComponentDescriptionProps } from './KitMarker'
import type { PropsDefinition } from '../componentPropsDirector'

/** 用途说明字段的运行时描述，由提供该 Props 协议的领域维护。 */
export const componentDescriptionPropsDefinition = {
  description: 'state-source-view',
  descriptionDisplay: 'state-value-view',
} satisfies PropsDefinition<ComponentDescriptionProps>

/** 用途说明领域声明事实的类型。 */
export type ComponentDescriptionPropDefinition =
  typeof componentDescriptionPropsDefinition
