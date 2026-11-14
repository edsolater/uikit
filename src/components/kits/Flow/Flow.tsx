/**
 * Flow 组织一组内容的排列方向。
 *
 * 提供可调间隔、横向换行与交叉轴对齐。
 *
 * 排列关系由组件表达，子组件继续拥有自己的外观。
 */
import { kit, type KitController } from '@/components/tools/kit'
import type { RefReceiver } from '@/hooks/createRef'
import { flowPropsDefinition } from './Flow.prop'
import type { ComponentDescriptionProps } from '@/components/tools/KitMarker/KitMarker'
import { type Source, type JSX, val } from '@/foundation'
import { Piv } from '@/components/Piv/Piv'
import './Flow.style'
/** Flow 的声明输入；初始状态通过 Props 表达。 */
export type FlowProps = ComponentDescriptionProps & {
  ref?: RefReceiver<FlowController>
  /** 子项间距，使用原生CSS gap值，默认1rem。 */
  gap?: Source<string | undefined>
  direction?: Source<'row' | 'column' | undefined>
  /** 容器自身的 CSS 宽度，未指定时由父布局决定。 */
  width?: Source<string | undefined>
  /** 作为父布局的子项占用剩余空间。 */
  grow?: Source<boolean | undefined>
  label?: Source<string | undefined>
  children?: JSX.Element
}

/** Flow 自有 Props 的指令式入口；ref 只从上游交付。 */
export type FlowController = KitController<
  FlowProps,
  typeof flowPropsDefinition
>

/**
 * 默认纵向排列，默认间隔 1rem；横向排列自动换行并在交叉轴居中，不接管子组件外观。
 */
export const Flow = kit(
  {
    name: 'Flow',
    description: '组织内容方向',
    availableProps: flowPropsDefinition,
  },
  (props: FlowProps) => {
    return (
      <Piv
        class="Flow"
        style={{
          '--flow-width': val(props.width) ?? 'auto',
          '--flow-gap': val(props.gap) ?? '1rem',
        }}
        htmlProps={{
          'data-direction': props.direction,
          'data-grow': String(val(props.grow) ?? false),
          'aria-label': props.label,
        }}
      >
        {props.children}
      </Piv>
    )
  },
)
