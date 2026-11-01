/**
 * Flow 组织一组内容的排列方向。
 *
 * 提供固定间隔、横向换行与交叉轴对齐。
 *
 * 排列关系由组件表达，子组件继续拥有自己的外观。
 */
import { kit } from '@/components/utils/kit'
import type { PropsController } from '@/components/utils/componentPropsDirector'
import type { RefReceiver } from '@/hooks/createRef'
import { flowPropsDefinition } from './Flow.prop'
import type { ComponentDescriptionProps } from '@/components/ComponentMarker/ComponentMarker'
import { type Source, type JSX } from '@/foundation'
import { Piv } from '@/components/Piv/Piv'
import './Flow.style'
/** Flow 的声明输入；初始状态通过 Props 表达。 */
export type FlowProps = ComponentDescriptionProps & {
  ref?: RefReceiver<FlowController>
  direction?: Source<'row' | 'column' | undefined>
  children?: JSX.Element
}

/** Flow 自有 Props 的指令式入口；ref 只从上游交付。 */
export type FlowController = PropsController<FlowProps, typeof flowPropsDefinition>

/**
 * 默认纵向排列，固定间隔 1rem；横向排列自动换行并在交叉轴居中，不接管子组件外观。
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
        htmlProps={{
          'data-direction': props.direction,
        }}
      >
        {props.children}
      </Piv>
    )
  },
)
