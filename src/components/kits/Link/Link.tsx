/**
 * 保留原生目标语义的导航链接。
 *
 * 表达当前链接和另开页面，不自带信息卡片。
 *
 * 让导航机制与调用方的链接内容各自独立。
 */
import { Piv } from '../../Piv/Piv'
import { kit, type KitComponent } from '../../tools/kit'
import {
  componentName,
  linkPropDefinition,
  type LinkProps,
  type LinkController,
} from './Link.prop'
import { derive } from '@/hooks/stateUtils'

import './Link.style'

/**
 * 保留原生导航、另开页面与当前项语义的链接。
 */
export const Link: KitComponent<{
  props: LinkProps
  controller: LinkController
}> = kit(
  {
    name: componentName,
    componentDescription: '导航到目标页面',
    propDefinition: linkPropDefinition,
  },
  (props, { name }) => {
    return (
      <Piv
        shadowProps={props}
        as="a"
        class={name}
        htmlProps={{
          'href': props.href,
          'aria-current': derive(props.current, current =>
            current ? 'page' : undefined,
          ),
          'target': props.newTab ? '_blank' : undefined,
          'rel': props.newTab ? 'noopener noreferrer' : undefined,
        }}
      >
        {props.children}
      </Piv>
    )
  },
)
