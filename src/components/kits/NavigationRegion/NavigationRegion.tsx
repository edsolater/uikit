/**
 * NavigationRegion 组织具名导航区域。
 *
 * 提供原生 nav 身份与区域说明。
 *
 * 具体链接与导航内容由调用方组合。
 */
import { kit, type KitController } from '@/components/utils/kit'
import type { RefReceiver } from '@/hooks/createRef'
import { navigationRegionPropsDefinition } from './NavigationRegion.prop'
import type { ComponentDescriptionProps } from '@/components/ComponentMarker/ComponentMarker'
import { type Source, type JSX } from '@/foundation'
import { Piv } from '@/components/Piv/Piv'
import './NavigationRegion.style'
/** NavigationRegion 的声明输入；初始状态通过 Props 表达。 */
export type NavigationRegionProps = ComponentDescriptionProps & {
  ref?: RefReceiver<NavigationRegionController>
  label: Source<string>
  children?: JSX.Element
}

/** NavigationRegion 自有 Props 的指令式入口；ref 只从上游交付。 */
export type NavigationRegionController = KitController<NavigationRegionProps, typeof navigationRegionPropsDefinition>

/**
 * 组织具名导航区域。
 */
export const NavigationRegion = kit(
  {
    name: 'NavigationRegion',
    description: '组织具名导航区域',
    availableProps: navigationRegionPropsDefinition,
  },
  (props: NavigationRegionProps) => {
    return (
      <Piv
        as="nav"
        class="NavigationRegion"
        htmlProps={{ 'aria-label': props.label }}
      >
        {props.children}
      </Piv>
    )
  },
)
