/**
 * Grid 是按列结构组织内容的布局组件。
 *
 * 将内容与区域名称交给同一真实根，样式配置由同名样式文件解释。
 *
 * 网格负责排列，子组件保留自己的外观和交互。
 */
import { Piv } from '../../Piv/Piv'
import { kit, type KitComponent } from '../../tools/kit'

import {
  componentName,
  gridPropDefinition,
  type GridProps,
  type GridController,
} from './Grid.prop'
import { gridStyleConfig } from './Grid.style'

/**
 * 默认单列并自动适应窄屏，必要时通过 styleConfig 指定列结构。
 */
export const Grid: KitComponent<{
  props: GridProps
  controller: GridController
}> = kit(
  {
    name: componentName,
    componentDescription: '按列结构组织内容',
    propDefinition: gridPropDefinition,
    styleConfig: gridStyleConfig,
  },
  (props, { name }) => (
    <Piv shadowProps={props} class={name}>
      {props.children}
    </Piv>
  ),
)
