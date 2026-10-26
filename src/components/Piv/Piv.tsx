/**
 * Piv 管理元素身份、显示分支、声明来源与插件生命周期。
 * 组织后的 DOM 声明交给内部 Dode 解析和绑定，两者共用一个真实元素。
 */
import type { MayArray } from '@edsolater/fnkit'
import { Show, type JSX, val, type Source } from '@/foundation'
import { Dode, type DodeDOMProps } from './Dode'
import {
  domMap,
  type CreatePivElement,
  type PivSupportedElementTag,
  type PivTag,
} from './domMap'
import { mergePivProps, type ShadowProps } from './plugin/handlePivPlugin'
import type { PivPlugin } from './plugin/runPlugin'
import type { PublicCapabilityProps } from './plugin/publicCapabilities'

export interface PivProps<Tag extends PivTag = 'div'>
  extends DodeDOMProps<Tag>, PublicCapabilityProps {
  /** 原生元素类型，默认 div；只能由直接声明决定。 */
  as?: Tag
  /** false 时元素与子内容不进入 DOM；只能由直接声明决定。 */
  if?: Source<boolean>
  /** 上层组件转交的低优先级声明，接受一份或一维数组。 */
  shadowProps?: MayArray<ShadowProps<Tag>>
  /** 使用真实 DOM 的扩展入口；可以返回低优先级声明或仅执行结构能力。 */
  plugin?: MayArray<PivPlugin<Tag>>
  /** 多插件的兼容入口；单个能力优先使用 plugin。 */
  plugins?: MayArray<PivPlugin<Tag>>
  /** plugin 的语义化别名，表达稳定能力或性质。 */
  trait?: MayArray<PivPlugin<Tag>>
}

/** 对外管理入口；底层 DOM 属性契约由 Dode 提供。 */
export function Piv<Tag extends PivSupportedElementTag = 'div'>(
  rawProps: PivProps<Tag>,
): JSX.Element {
  const jsxCreator = domMap[rawProps.as ?? 'div'] as CreatePivElement<Tag>
  const createElement = () => (
    <Dode
      createElement={jsxCreator}
      children={rawProps.children}
      setup={(element) => mergePivProps(element, rawProps)}
    />
  )
  return rawProps.if !== undefined ? (
    <Show when={val(rawProps.if)}>{createElement()}</Show>
  ) : (
    createElement()
  )
}
