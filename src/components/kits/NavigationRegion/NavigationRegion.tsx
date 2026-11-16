/**
 * NavigationRegion 组织具名导航区域。
 *
 * 提供原生 nav 身份与区域说明。
 *
 * 具体链接与导航内容由调用方组合。
 */
import { Piv } from '../../Piv/Piv'
import { kit, type KitComponent } from '../../tools/kit'
import {
  componentName,
  navigationRegionPropDefinition,
  type NavigationRegionProps,
  type NavigationRegionController,
} from './NavigationRegion.prop'

import './NavigationRegion.style'

/**
 * 组织具名导航区域。
 */
export const NavigationRegion: KitComponent<
  NavigationRegionProps,
  NavigationRegionController
> = kit(
  {
    name: componentName,
    description: '组织具名导航区域',
    propDefinition: navigationRegionPropDefinition,
  },
  (props, { name }) => {
    return (
      <Piv
        shadowProps={props}
        as="nav"
        class={name}
        htmlProps={{ 'aria-label': props.label }}
      >
        {props.children}
      </Piv>
    )
  },
)
