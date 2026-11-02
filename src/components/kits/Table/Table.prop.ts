/**
 * Table 的数据、列选择与渲染部件协议。
 *
 * 数据继续交给原 Source 消费；keys 读取当前值以保留缺省列推导。
 *
 * 行与渲染器的泛型关联保留在组件类型，不引入新的列系统。
 */
import { componentDescriptionPropsDefinition } from '@/components/tools/KitMarker/KitMarker.prop'
import type { PropsDefinition } from '@/components/tools/componentPropsDirector'
import type { TableProps } from './Table'

export const tablePropsDefinition = {
  ...componentDescriptionPropsDefinition,
  data: 'state-source-view',
  keys: 'state-value-view',
  renderParts: 'state-value-view',
  compact: 'state-source-view',
  columnMinWidths: 'state-value-view',
  cellTitle: 'state-value-view',
  cellIntensity: 'state-value-view',
  ref: 'only-through-prop',
} satisfies PropsDefinition<TableProps>
