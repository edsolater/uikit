/**
 * 组件身份结构查看的显示字段协议。
 *
 * 定位显示的读取事实由 Marker 领域声明。
 *
 * Kit 的公共表组合这些事实，不重复维护模式。
 */
import type { ComponentIdentityMarkerDisplayProps } from './ComponentIdentityMarker'
import type { PropsDefinition } from '../componentPropsDirector'

/** 结构查看显示字段的运行时描述，由提供该 Props 协议的领域维护。 */
export const componentIdentityMarkerDisplayPropsDefinition = {
  descriptionDisplay: 'state-value-view',
} satisfies PropsDefinition<ComponentIdentityMarkerDisplayProps>

/** 结构查看领域声明事实的类型。 */
export type ComponentIdentityMarkerDisplayPropDefinition =
  typeof componentIdentityMarkerDisplayPropsDefinition
