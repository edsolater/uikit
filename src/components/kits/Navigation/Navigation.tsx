import {
  ComponentWrapper,
  type ComponentDescriptionProps,
} from '@/components/ComponentWrapper/ComponentWrapper'
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
    <ComponentWrapper
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
    </ComponentWrapper>
  )
}
