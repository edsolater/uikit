/**
 * Piv 是声明来源与插件的管理入口。
 *
 * 创建前组织直接声明、shadowProps 与 Plugin，选择 as／if 来源，并把实例名称转换为根元素的无障碍名称。
 *
 * 管理语义在本层完成，Dode 只绑定原生声明；两者共用一个真实元素。
 */
import { toArray, type MayArray } from '@edsolater/fnkit'
import { val, type JSX, type Source } from '@/foundation'
import { createComponent, mergeProps, omitProps } from '@/foundation/render'
import type { HTMLPropsRecord } from './handleHTMLProps'
import { Dode, type DodeDOMProps } from './Dode'
import type { PivSupportedElementTag, PivTag } from './domMap'
import { mergePivProps, type ShadowProps } from './plugin/mergePivProps'
import type { PluginInput } from '../plugins/tools/createInactivePlugin'

/** 组合底层原生输入与本层实例名称、声明来源和附加能力。 */
export interface PivProps<
  Tag extends PivTag = 'div',
> extends DodeDOMProps<Tag> {
  /**
   * 具体 Component 实例使用的业务名称或用途，属于 PivProps。
   * Component 本身的职责 description 属于 KitOptions。
   * 支持静态与响应式输入，由本层转换为根元素的 aria-label。
   */
  label?: Source<string | undefined>
  /** 上层组件转交的低优先级声明，接受一份或一维数组。 */
  shadowProps?: MayArray<ShadowProps<Tag>>
  /** 声明附加到节点的能力，接受 Plugin、能力结果或数组。 */
  is?: MayArray<PluginInput>
}

/**
 * 创建前展开声明与 Plugin，将实例 label 转换为低优先级原生名称。
 * 显式 htmlProps 的命名优先；Dode 只消费转换后的原生声明，不接收 label。
 */
export function Piv<Tag extends PivSupportedElementTag = 'div'>(
  props: PivProps<Tag>,
): JSX.Element {
  const merged = mergePivProps(props)
  // ARIA 名称属于所有原生标签；先建立本标签的声明记录，再补入共同字段。
  const labelProps: HTMLPropsRecord<Tag> = {}
  labelProps['aria-label'] = merged.label
  return createComponent(
    Dode,
    mergeProps(
      omitProps(() => merged, 'label'),
      {
        get htmlProps() {
          return [labelProps, ...toArray(val(merged.htmlProps))]
        },
      },
    ),
  )
}
