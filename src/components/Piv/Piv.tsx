/**
 * Piv 是声明来源与插件的管理入口。
 *
 * 创建前组织直接声明、shadowProps 与已构建 Plugin 的声明，统一解析 as／if；
 * 组织后的 DOM 声明交给内部 Dode 解析和绑定，两者共用一个真实元素。
 */
import type { MayArray } from '@edsolater/fnkit'
import type { JSX } from '@/foundation'
import { createComponent } from '@/foundation/render'
import { Dode, type DodeDOMProps } from './Dode'
import type { PivSupportedElementTag, PivTag } from './domMap'
import { mergePivProps, type ShadowProps } from './plugin/mergePivProps'
import type { PluginInput } from '@/components/plugins/tools/defineInactivePlugin'

export interface PivProps<Tag extends PivTag = 'div'>
  extends DodeDOMProps<Tag> {
  /** 上层组件转交的低优先级声明，接受一份或一维数组。 */
  shadowProps?: MayArray<ShadowProps<Tag>>
  /** 声明附加到节点的能力，接受 Plugin、能力结果或数组。 */
  is?: MayArray<PluginInput>
}

/**
 * 创建前展开声明与 Plugin，再交给 Dode 按最终 as／if 创建和绑定节点。
 */
export function Piv<Tag extends PivSupportedElementTag = 'div'>(
  props: PivProps<Tag>,
): JSX.Element {
  return createComponent(Dode, mergePivProps(props))
}
