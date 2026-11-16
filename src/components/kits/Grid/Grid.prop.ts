/**
 * Grid 的内容输入与实例控制协议。
 *
 * 声明网格内容和可访问名称，排列差异通过独立样式配置表达。
 *
 * 子内容的外观和业务状态仍归各自组件。
 */
import type { Source } from '@/foundation'
import {
  kitPropDefinition,
  type KitProps,
  type KitPropDefinition,
  type KitController,
} from '../../tools/kit'
import type { GridStyleConfig } from './Grid.style'

/** 组件统一身份，供创建声明和样式关联引用。 */
export const componentName = 'Grid'

/** 网格的公共输入与区域名称。 */
export type GridProps = KitProps<GridStyleConfig, GridController> & {
  label?: Source<string | undefined>
}

/** 区域名称保持来源，由真实根元素消费。 */
export type GridPropDefinition = KitPropDefinition<{
  label: 'state-source-view'
}>

/** 公开字段与公共节点协议的完整定义。 */
export const gridPropDefinition: GridPropDefinition = {
  ...kitPropDefinition,
  label: 'state-source-view',
}

/** 网格实例的输入控制，样式差异通过 props.styleConfig 干预。 */
export interface GridController extends KitController<
  GridProps,
  GridPropDefinition
> {}
