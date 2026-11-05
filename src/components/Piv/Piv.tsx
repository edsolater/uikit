/**
 * Piv 是声明来源与插件的管理入口。
 *
 * 组织直接声明和 shadowProps，管理插件生命周期。
 *
 * 组织后的 DOM 声明交给内部 Dode 解析和绑定，两者共用一个真实元素。
 */
import type { MayArray } from '@edsolater/fnkit'
import type { JSX } from '@/foundation'
import { Dode, type DodeDOMProps } from './Dode'
import type { PivSupportedElementTag, PivTag } from './domMap'
import {
  getPivStructureProps,
  mergePivProps,
  type PivShadowProps,
} from './plugin/handlePivPlugin'
import type { Plugin } from '@/components/plugins/defineInactivePlugin'
import type { PublicCapabilityProps } from './plugin/publicCapabilities'

export interface PivProps<Tag extends PivTag = 'div'>
  extends DodeDOMProps<Tag>, PublicCapabilityProps {
  /** 上层组件转交的低优先级声明，接受一份或一维数组。 */
  shadowProps?: MayArray<PivShadowProps<Tag>>
  /** 声明附加到节点的能力，接受单个 Plugin 或数组。 */
  is?: MayArray<Plugin>
}

/**
 * 组织创建前的声明来源，并在真实元素可用后接入插件与字段合并。
 */
export function Piv<Tag extends PivSupportedElementTag = 'div'>(
  rawProps: PivProps<Tag>,
): JSX.Element {
  const structure = getPivStructureProps(rawProps)
  return (
    <Dode
      structure={structure}
      setup={(element) => mergePivProps(element, rawProps)}
    />
  )
}
