/**
 * 简短补充说明的帮助入口。
 *
 * 拥有默认问号及其可访问名称，通过既有 tooltip 插件显示内容。
 *
 * 让字段标题和其他界面都能组合相同的帮助组件。
 */
import { Piv } from '../../Piv/Piv'
import { val } from '@/foundation'
import { omitProps } from '@/foundation/render'

import { tooltip } from '../../plugins/kits/tooltip/tooltip'
import { kit, type KitComponent } from '../../tools/kit'
import {
  componentName,
  helpPropDefinition,
  type HelpProps,
  type HelpController,
} from './Help.prop'
import './Help.style'

/**
 * 显示可独立使用的帮助入口，浮层定位与阅读交互交给 tooltip。
 */
export const Help: KitComponent<{
  props: HelpProps
  controller: HelpController
}> = kit(
  {
    name: componentName,
    componentDescription: '查看补充说明',
    propDefinition: helpPropDefinition,
  },
  (props, { name }) => (
    <Piv
      shadowProps={omitProps(() => props, 'label')}
      as="button"
      class={name}
      is={tooltip({
        get content() {
          return props.tooltip
        },
      })}
      label={val(props.label) ?? '帮助说明'}
      htmlProps={{ type: 'button' }}
    >
      {val(props.trigger) ?? '?'}
    </Piv>
  ),
)
