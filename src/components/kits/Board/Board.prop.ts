/**
 * Board 的材质、尺寸与继承字段协议。
 *
 * 候选关系与缺省来源由承载组件拥有，Card 复用同一契约。
 *
 * 通用 Director 只消费来源，不感知分组规则。
 */
import { pivDefaultSources, pivPropsDefinition } from '@/components/Piv/Piv.prop'
import { componentDescriptionPropsDefinition } from '@/components/ComponentMarker/ComponentMarker.prop'
import type { PropsDefinition, DefaultPropSources } from '@/components/utils/componentPropsDirector'
import type { PivSupportedElementTag } from '@/components/Piv/domMap'
import { createVariantPropsParser } from '../utils/parseVariantProps'
import type { BoardProps } from './Board'

export const boardVariantGroups = [
  { groupName: 'variant', candidates: ['soft', 'solid'] },
  { groupName: 'size', candidates: ['small', 'large', 'xlarge'] },
] as const satisfies Parameters<typeof createVariantPropsParser>[0]

export const boardPropsDefinition = {
  ...pivPropsDefinition,
  ...componentDescriptionPropsDefinition,
  variant: 'state-source-view',
  soft: 'state-source-view',
  solid: 'state-source-view',
  size: 'state-source-view',
  small: 'state-source-view',
  large: 'state-source-view',
  xlarge: 'state-source-view',
  ref: 'only-through-prop',
} satisfies PropsDefinition<BoardProps<PivSupportedElementTag>>

const parseVariant = createVariantPropsParser([boardVariantGroups[0]])
const parseSize = createVariantPropsParser([boardVariantGroups[1]])
const boardDefaultSources = {
  ...pivDefaultSources,
  variant: input => {
    const { details } = parseVariant(input)
    return details.variant
  },
  size: input => {
    const { details } = parseSize(input)
    return details.size
  },
} satisfies DefaultPropSources<BoardProps<PivSupportedElementTag>, typeof boardPropsDefinition>

/**
 * 缺省分组由同一候选 State 推导；显式分组保留原声明诊断。
 */
export function getBoardPropsDirectorOptions(input: BoardProps<PivSupportedElementTag>) {
  return {
    defaultSources: boardDefaultSources,
    omit: boardVariantGroups.flatMap(group => group.groupName in input ? [] : group.candidates),
  }
}
