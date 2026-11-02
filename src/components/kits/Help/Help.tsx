/**
 * 简短补充说明的帮助入口。
 *
 * 拥有默认问号及其可访问名称，通过既有 tooltip 插件显示内容。
 *
 * 让字段标题和其他界面都能组合相同的帮助组件。
 */
import { val, type Source } from '@/foundation'
import type { ComponentDescriptionProps } from '@/components/tools/KitMarker/KitMarker'
import { Piv, type PivProps } from '@/components/Piv/Piv'
import { tooltip } from '@/components/plugins/kits/tooltip/tooltip'
import { kit, type KitController } from '@/components/tools/kit'
import type { RefReceiver } from '@/hooks/createRef'
import { helpPropsDefinition } from './Help.prop'
import './Help.style'

/** 帮助内容与入口；声明即显示入口，内容和触发文字持续接受 Source。 */
export type HelpProps = ComponentDescriptionProps & {
  ref?: RefReceiver<HelpController>
  tooltip?: PivProps['children']
  /** 替换默认问号的显示内容，不放入另一个交互控件。 */
  trigger?: PivProps['children']
  /** 帮助入口的可访问名称，缺省为“帮助说明”。 */
  name?: Source<string | undefined>
}

/** 可在运行期更新帮助内容、触发文字及可访问名称。 */
export type HelpController = KitController<
  HelpProps,
  typeof helpPropsDefinition
>

/**
 * 显示可独立使用的帮助入口，浮层定位与阅读交互交给 tooltip。
 */
export const Help = kit(
  {
    name: 'Help',
    description: '查看补充说明',
    availableProps: helpPropsDefinition,
  },
  (props: HelpProps) => (
    <Piv
      as="button"
      class="Help"
      plugin={tooltip({
        get content() {
          return props.tooltip
        },
      })}
      htmlProps={{
        'type': 'button',
        'aria-label': val(props.name) ?? '帮助说明',
      }}
    >
      {val(props.trigger) ?? '?'}
    </Piv>
  ),
)
