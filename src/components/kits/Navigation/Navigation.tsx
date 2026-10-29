import {
  ComponentMarker,
  type ComponentDescriptionProps,
} from '@/components/ComponentMarker/ComponentMarker'
import { type Source, type JSX } from '@/foundation'
import { Piv } from '@/components/Piv/Piv'
import './Navigation.style'
/** 组织具名导航区域。 */
export function Navigation(
  props: ComponentDescriptionProps & {
    label: Source<string>
    children?: JSX.Element
  },
) {
  return (
    <ComponentMarker
      componentName="Navigation"
      defaultDescription="组织具名导航区域"
      description={props.description}
      descriptionDisplay={props.descriptionDisplay}
    >
      <Piv
        as="nav"
        class="Navigation"
        htmlProps={{ 'aria-label': props.label }}
      >
        {props.children}
      </Piv>
    </ComponentMarker>
  )
}
