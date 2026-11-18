/**
 * Piv 是声明来源与插件的管理入口。
 *
 * 创建前组织直接声明、shadowProps 与 Plugin，选择 as／if 来源，并把实例名称转换为根元素的无障碍名称。
 *
 * 管理语义在本层完成，Dode 只绑定原生声明；两者共用一个真实元素。
 */
import { toArray, type MayArray } from '@edsolater/fnkit'
import { val, type JSX, type MayArraySource } from '@/foundation'
import { createComponent } from '@/foundation/render'
import { resolvePivLabel } from './label'
import type { HTMLPropsRecord } from './html-props'
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
   * Component 本身的职责 componentDescription 属于 KitOptions。
   * 支持静态、响应式与列表输入，列表按空格连接，由本层转换为根元素的 aria-label。
   */
  label?: MayArraySource<string | undefined>
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
  /**
   * 对外只呈现原生声明字段，label 投射到 htmlProps，不直接交给 Dode。
   * 此处不读取 Source，异步等待仍由原生字段的终端消费作用域接续。
   */
  const hasProperty = (key: PropertyKey) =>
    key !== 'label' &&
    (key in merged || (key === 'htmlProps' && 'label' in merged))
  const nativeProps = new Proxy(merged, {
    get(target, key) {
      if (key === 'label') return undefined
      // 没有 label 时原样转交，空值与列表交给既有 HTML 消费者归一。
      if (key !== 'htmlProps' || !('label' in target))
        return Reflect.get(target, key)
      const labelProps: HTMLPropsRecord<Tag> = {}
      labelProps['aria-label'] = () => resolvePivLabel(target.label)
      return [labelProps, ...toArray(val(target.htmlProps))]
    },
    has: (_, key) => hasProperty(key),
    ownKeys: target => [
      ...new Set(
        Reflect.ownKeys(target).map(key =>
          key === 'label' ? 'htmlProps' : key,
        ),
      ),
    ],
    getOwnPropertyDescriptor: (_, key) =>
      hasProperty(key) ? { enumerable: true, configurable: true } : undefined,
  })
  return createComponent(Dode, nativeProps)
}
