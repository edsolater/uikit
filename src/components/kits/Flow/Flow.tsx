import {
  ComponentWrapper,
  type ComponentDescriptionProps,
} from '@/components/ComponentWrapper/ComponentWrapper'
import { type Source, type JSX } from '@/foundation'
import { Piv } from '@/components/Piv/Piv'
import './Flow.style'
/** 默认纵向排列，固定间隔 1rem；横向排列自动换行并在交叉轴居中，不接管子组件外观。 */
export function Flow(
  props: ComponentDescriptionProps & {
    direction?: Source<'row' | 'column'>
    children?: JSX.Element
  },
) {
  return (
    <ComponentWrapper
      componentName="Flow"
      defaultDescription="组织内容方向"
      description={props.description}
      descriptionDisplay={props.descriptionDisplay}
    >
      <Piv
        class="Flow"
        htmlProps={{
          'data-direction': props.direction,
        }}
      >
        {props.children}
      </Piv>
    </ComponentWrapper>
  )
}
