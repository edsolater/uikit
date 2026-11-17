/**
 * Flow 是一组相关内容的顺序排列组件。
 *
 * 组织子内容并接入共同的说明、引用和样式输入。
 *
 * 排列样式由同名样式文件拥有，核心不解释样式值或子组件外观。
 */
import { kit, type KitComponent } from '../../tools/kit'
import { Piv } from '../../Piv/Piv'
import { flowStyleConfig } from './Flow.style'
import {
  componentName,
  flowPropDefinition,
  type FlowProps,
  type FlowController,
} from './Flow.prop'

/**
 * 按默认横向排列组织顺序内容，自动换行并在交叉轴居中。
 * 必要的纵向排列通过配置表达，原生声明完整交给同一 Piv 根。
 */
export const Flow: KitComponent<{
  props: FlowProps
  controller: FlowController
}> = kit(
  {
    name: componentName,
    componentDescription: '组织内容方向',
    propDefinition: flowPropDefinition,
    $styleConfig: flowStyleConfig,
  },
  (props, { name }) => (
    <Piv shadowProps={props} class={name}>
      {props.children}
    </Piv>
  ),
)
