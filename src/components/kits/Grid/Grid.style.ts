/**
 * Grid 的列结构与实例样式配置。
 *
 * 默认单列，窄屏回到单列；显式关闭响应布局时保持实例列模板。
 *
 * 每个实例只覆盖自己的 Token，嵌套网格保持独立默认值。
 */
import { componentName } from './Grid.prop'
import { rules, token, stateCondition } from '@/style-system'
import type { StyleConfig } from '../../tools/styleConfig'

/** 网格的排列配置；省略字段沿用 Token 默认值。 */
export interface GridStyleConfig {
  /** 数字表示等宽列数，字符串表示完整列模板。 */
  columns?: number | string
  /** 在父网格中跨越的列数。 */
  columnSpan?: number
  /** 默认窄于 48rem 时回到单列，false 保持指定列模板。 */
  responsive?: boolean
  gap?: string
  /** 原生列、行间隙装饰，默认不绘制。 */
  columnRule?: string
  rowRule?: string
  /** 在父级弹性布局中占用剩余空间。 */
  grow?: boolean
}

/** 按配置提交本实例的排列差异，清空配置即撤销覆盖。 */
export const gridStyleConfig = {
  /**
   * 将列数转换为等宽模板，完整模板直接交给布局消费。
   */
  columns: (value) =>
    gridColumns.set(
      typeof value === 'number'
        ? 'repeat(' + value + ', minmax(0, 1fr))'
        : value,
    ),
  /**
   * 为当前网格设置它在父网格中占用的列跨度。
   */
  columnSpan: (value) => gridColumnSpan.set('span ' + value),
  /**
   * 固定布局继续引用实例列模板，避免复制当前列数形成第二份来源。
   */
  responsive: (value) => {
    if (!value) columns.set(gridColumns.toCSSString())
  },
  /**
   * 设置当前网格子项之间的间距。
   */
  gap: (value) => gridGap.set(value),
  /**
   * 设置列间装饰。
   */
  columnRule: (value) => gridColumnRule.set(value),
  /**
   * 设置行间装饰。
   */
  rowRule: (value) => gridRowRule.set(value),
  /**
   * 按需占用父级弹性布局的剩余空间。
   */
  grow: (value) => {
    if (value) flex.set('1')
  },
} satisfies StyleConfig<GridStyleConfig>

/** 实例列模板，供普通布局与固定布局共用。 */
export const gridColumns = token('repeat(1, minmax(0, 1fr))', {
  name: 'grid-columns',
})
const columns = token(gridColumns, {
  name: 'grid-template-columns',
  state: [[stateCondition('@media (width < 48rem)'), 'minmax(0, 1fr)']],
})
/** 当前网格作为父级子项的列跨度。 */
export const gridColumnSpan = token('auto', { name: 'grid-column' })
/** 子项之间的默认间距。 */
export const gridGap = token('1rem', { name: 'grid-gap' })
/** 列与行间隙各自的装饰材料。 */
export const gridColumnRule = token('none', { name: 'grid-column-rule' })
export const gridRowRule = token('none', { name: 'grid-row-rule' })
const flex = token('initial', { name: 'grid-flex' })

rules(`.${componentName}`, {
  'display': 'grid',
  'grid-template-columns': columns,
  'grid-column': gridColumnSpan,
  'gap': gridGap,
  'column-rule': gridColumnRule,
  'row-rule': gridRowRule,
  'align-items': 'start',
  'min-width': '0',
  flex,
})
