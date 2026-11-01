/**
 * Popover 的内容、触发配置与位置字段协议。
 *
 * 位置缺省来源复用原解析器，原生浮层控制与挂载行为仍由组件核心拥有。
 *
 * 通用 Props Controller 不冒充原有的浮层操作 Controller。
 */
import { componentDescriptionPropsDefinition } from '@/components/ComponentMarker/ComponentMarker.prop'
import type { PropsDefinition, DefaultPropSources } from '@/components/utils/componentPropsDirector'
import { createVariantPropsParser } from '../utils/parseVariantProps'
import type { PopoverProps } from './Popover'

export const popoverVariantGroups = [
  { groupName: 'placement', candidates: ['top', 'right', 'bottom', 'left'] },
] as const satisfies Parameters<typeof createVariantPropsParser>[0]

export const popoverPropsDefinition = {
  ...componentDescriptionPropsDefinition,
  placement: 'state-source-view',
  top: 'state-source-view',
  right: 'state-source-view',
  bottom: 'state-source-view',
  left: 'state-source-view',
  class: 'state-value-view',
  style: 'state-value-view',
  trigger: 'state-value-view',
  title: 'state-value-view',
  children: 'state-value-view',
  triggerClass: 'state-value-view',
  triggerStyle: 'state-value-view',
  surfaceClass: 'state-value-view',
  surfaceStyle: 'state-value-view',
  popover: 'state-value-view',
  triggerAction: 'state-value-view',
  // 仅挂载阶段读取，初始打开状态由 Props 配置。
  defaultOpen: 'only-through-prop',
  triggerProps: 'state-value-view',
  surfaceProps: 'state-value-view',
  onToggle: 'state-untracked',
  onBeforeToggle: 'state-untracked',
  ref: 'only-through-prop',
} satisfies PropsDefinition<PopoverProps>

const parsePlacement = createVariantPropsParser(popoverVariantGroups)
const popoverDefaultSources = {
  placement: input => {
    const { details } = parsePlacement(input)
    return details.placement
  },
} satisfies DefaultPropSources<PopoverProps, typeof popoverPropsDefinition>

/**
 * 未声明位置字段时，从同一候选 State 推导位置；输出不伪造候选冲突。
 */
export function getPopoverPropsDirectorOptions(input: PopoverProps) {
  return {
    defaultSources: popoverDefaultSources,
    omit: 'placement' in input ? [] : popoverVariantGroups[0].candidates,
  }
}
