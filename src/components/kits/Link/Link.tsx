/**
 * 保留原生目标语义的导航链接。
 *
 * 表达当前链接和另开页面，不自带信息卡片。
 *
 * 让导航机制与调用方的链接内容各自独立。
 */
import {
  ComponentWrapper,
  type ComponentDescriptionProps,
} from '@/components/ComponentWrapper/ComponentWrapper'
import { derive } from '@/hooks/stateUtils'
import { type JSX, type Source } from '@/foundation'
import { Piv } from '@/components/Piv/Piv'
import './Link.style'
/**
 * 保留原生导航、另开页面与当前项语义的链接。
 */
export function Link(
  props: ComponentDescriptionProps & {
    href: Source<string>
    children?: JSX.Element
    current?: Source<boolean>
    newTab?: boolean
  },
) {
  return (
    <ComponentWrapper
      componentName="Link"
      defaultDescription="导航到目标页面"
      description={props.description}
      descriptionDisplay={props.descriptionDisplay}
    >
      <Piv
        as="a"
        class="Link"
        htmlProps={{
          href: props.href,
          'aria-current': derive(props.current, (current) =>
            current ? 'page' : undefined,
          ),
          target: props.newTab ? '_blank' : undefined,
          rel: props.newTab ? 'noopener noreferrer' : undefined,
        }}
      >
        {props.children}
      </Piv>
    </ComponentWrapper>
  )
}
