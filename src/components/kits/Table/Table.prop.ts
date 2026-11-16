/**
 * Table 的输入与实例控制协议。
 *
 * 将记录、字段列、合成列及内容渲染器的泛型关系集中声明。
 *
 * 字段定义紧邻输入声明，组件实现按这份契约创建内容。
 */
import {
  kitPropDefinition,
  type KitProps,
  type KitPropDefinition,
  type KitController,
} from '../../tools/kit'
import type { Source, JSX } from '@/foundation'
import type { JSXable } from '../../tools/toJSX'
import type { ControllerCollection } from '../../tools/controllerRegistry'
import type { TableStyleConfig } from './Table.style'

/** 组件统一身份，供创建声明和样式关联引用。 */
export const componentName = 'Table'

/** 字段列交付对应字段值，合成列交付 undefined。 */
export type TableCellValue<Row, ColumnKey> = ColumnKey extends keyof Row
  ? Row[ColumnKey]
  : undefined

/**
 * 表格数据、列选择与单元格表达；根节点声明沿用 Kit。
 * 公共 children 保留统一输入位置，当前行列内容仍由 data 与 renderParts 生成。
 */
export type TableProps<
  Row = object,
  ColumnKey extends PropertyKey = keyof Row,
> = KitProps<TableStyleConfig<ColumnKey>, TableController<Row, ColumnKey>> & {
  /** 同构对象队列；第一行对象的 key 决定默认列顺序，允许接收动态派生值。 */
  data: Source<Row[]>

  /** 显示列及顺序，允许合成列；未提供时使用第一行对象的全部字段。空数据仍保留显式列。 */
  keys?: Source<ColumnKey[]>

  /** 各列的原生单元格提示，读取原始行和零基行号。 */
  cellTitle?: Partial<
    Record<ColumnKey, (row: Row, index: number) => string | undefined>
  >
  /** 各列的 0～1 着色强度；null 使用最低强度，不承担业务比例计算。 */
  cellIntensity?: Partial<
    Record<ColumnKey, (row: Row, index: number) => number | null>
  >

  /** 纯内容渲染器集合，不改变 Table 对语义表格结构的控制权。 */
  renderParts?: {
    /** 将当前单元格值和它所属的对象 key 渲染为单元格内容。 */
    tableCell?: {
      [Key in ColumnKey]?: (
        value: TableCellValue<Row, Key>,
        columnKey: Key,
        row: Row,
        index: number,
      ) => JSXable
    }

    /** 将当前对象 key 渲染为表头内容。 */
    tableHead?: {
      [Key in ColumnKey]?: (columnKey: Key) => JSXable
    }
  }
}

/** 组件自有输入的读取方式。 */
const tableOwnPropDefinition = {
  data: 'state-source-view',
  keys: 'state-value-view',
  renderParts: 'state-value-view',
  cellTitle: 'state-value-view',
  cellIntensity: 'state-value-view',
} as const

/** 完整字段协议，公共输入由 Kit 提供。 */
export type TablePropDefinition = KitPropDefinition<
  typeof tableOwnPropDefinition
>

/** 运行时协议与输入类型共同约束读取方式。 */
export const tablePropDefinition: TablePropDefinition = {
  ...kitPropDefinition,
  ...tableOwnPropDefinition,
}

/** 指定行、列关系的实例输入控制。 */
export interface TableController<
  Row = object,
  ColumnKey extends PropertyKey = keyof Row,
> extends KitController<TableProps<Row, ColumnKey>, TablePropDefinition> {}

/** 行列相关字段由精确 ref 控制；集合只提供与具体记录类型无关的字段。 */
export interface TableComponent {
  <Row, ColumnKey extends PropertyKey = keyof Row>(
    props: TableProps<Row, ColumnKey>,
  ): JSX.Element
  controllers: ControllerCollection<{
    props: Omit<
      TableController<Record<PropertyKey, unknown>, PropertyKey>['props'],
      'data' | 'keys' | 'renderParts' | 'cellTitle' | 'cellIntensity'
    >
  }>
}
