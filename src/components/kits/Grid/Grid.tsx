import {
  ComponentMarker,
  type ComponentDescriptionProps,
} from '@/components/ComponentMarker/ComponentMarker'
import { type Source, type JSX } from '@/foundation'
import { Piv } from '@/components/Piv/Piv'
import './Grid.style'
/** 默认一列，按 columns 等宽分栏并固定间隔 1rem；视口宽度小于 48rem 时统一为单列。 */
export function Grid(
  props: ComponentDescriptionProps & {
    columns?: Source<1 | 2 | 3>
    children?: JSX.Element
  },
) {
  return (
    <ComponentMarker
      componentName="Grid"
      defaultDescription="以等宽列组织内容"
      description={props.description}
      descriptionDisplay={props.descriptionDisplay}
    >
      <Piv class="Grid" htmlProps={{ 'data-columns': props.columns ?? 1 }}>
        {props.children}
      </Piv>
    </ComponentMarker>
  )
}
