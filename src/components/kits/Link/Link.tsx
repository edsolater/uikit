/**
 * 保留原生目标语义的导航链接。
 *
 * 表达当前链接和另开页面，不自带信息卡片。
 *
 * 让导航机制与调用方的链接内容各自独立。
 */
import { kit, type KitController } from '@/components/utils/kit'
import type { RefReceiver } from '@/hooks/createRef'
import { linkPropsDefinition } from './Link.prop'
import type { ComponentDescriptionProps } from '@/components/ComponentMarker/ComponentMarker'
import { derive } from '@/hooks/stateUtils'
import { type JSX, type Source } from '@/foundation'
import { Piv } from '@/components/Piv/Piv'
import './Link.style'
/** Link 的声明输入；初始状态通过 Props 表达。 */
export type LinkProps = ComponentDescriptionProps & {
  ref?: RefReceiver<LinkController>
  href: Source<string>
  children?: JSX.Element
  current?: Source<boolean | undefined>
  newTab?: boolean
}

/** Link 自有 Props 的指令式入口；ref 只从上游交付。 */
export type LinkController = KitController<LinkProps, typeof linkPropsDefinition>

/**
 * 保留原生导航、另开页面与当前项语义的链接。
 */
export const Link = kit(
  {
    name: 'Link',
    description: '导航到目标页面',
    availableProps: linkPropsDefinition,
  },
  (props: LinkProps) => {
    return (
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
    )
  },
)
