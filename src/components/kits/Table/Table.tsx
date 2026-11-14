/**
 * Table 将对象记录按字段列或合成列展示为语义表格。
 *
 * 统一负责表格结构、横向滚动、密度和单元格表达，保留原始行供渲染器读取。
 *
 * 调用方提供内容与比例，不接管表格 DOM；排序、筛选和分页由外部负责。
 */
import { kit, type KitController } from '@/components/tools/kit'
import type { ControllerCollection } from '@/components/tools/controllerRegistry'
import type { RefReceiver } from '@/hooks/createRef'
import { tablePropsDefinition } from './Table.prop'
import { For, stateView, val, type Source, type JSX } from '@/foundation'
import { toJSX, type JSXable } from '../../tools/toJSX'
import { Piv } from '../../Piv/Piv'
import type { ComponentDescriptionProps } from '@/components/tools/KitMarker/KitMarker'
import './Table.style'

type TableDataRow = Record<PropertyKey, unknown>

/** 字段列保留字段值类型；合成列没有对应字段，值为 undefined。 */
type TableCellValue<Row, ColumnKey> = ColumnKey extends keyof Row
  ? Row[ColumnKey]
  : undefined

/**
 * Table 的输入数据与渲染部件配置。
 */
export type TableProps<
  Row = object,
  ColumnKey extends PropertyKey = keyof Row,
> = ComponentDescriptionProps & {
  ref?: RefReceiver<TableController<Row, ColumnKey>>
  /** 同构对象队列；第一行对象的 key 决定默认列顺序，允许接收动态派生值。 */
  data: Source<Row[]>

  /** 显示列及顺序，允许合成列；未提供时使用第一行对象的全部字段。空数据仍保留显式列。 */
  keys?: Source<ColumnKey[]>

  /** 紧凑显示，所有表格内容保持单行。 */
  compact?: Source<boolean | undefined>
  /** 各列的最小宽度，单位为 px。 */
  columnMinWidths?: Partial<Record<ColumnKey, number>>
  /** 各列的原生CSS首选宽度；默认auto，内容最小宽度仍由表格布局负责。 */
  columnWidths?: Partial<Record<ColumnKey, string>>
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

/** 精确 Row 的数据、列与渲染部件指令入口。 */
export type TableController<
  Row = object,
  ColumnKey extends PropertyKey = keyof Row,
> = KitController<TableProps<Row, ColumnKey>, typeof tablePropsDefinition>

interface TableComponent {
  <Row, ColumnKey extends PropertyKey = keyof Row>(
    props: TableProps<Row, ColumnKey>,
  ): JSX.Element
  controllers: ControllerCollection<{
    readonly props: Omit<
      TableController<TableDataRow, PropertyKey>['props'],
      | 'data'
      | 'keys'
      | 'renderParts'
      | 'columnMinWidths'
      | 'columnWidths'
      | 'cellTitle'
      | 'cellIntensity'
    >
  }>
}

/**
 * Table 是 UIKit 里“对象队列 -> 语义化表格结构”的基础组件节点。
 * 它接收同构对象数组，把对象 key 当作列来源，把每个对象当作一行。
 * `keys` 指定字段列或合成列；`renderParts` 只改写内容，不接管 table 结构。
 * `data` 和 `keys` 可以是普通值，也可以是继续传递的动态值，Table 会在最终渲染位置消费当前值。
 *
 * @example
 * <Table
 *   data={[
 *     { name: '蓝色', preview: 'oklch(60% 0.15 250)' },
 *     { name: '暖灰', preview: 'oklch(80% 0.02 60)' },
 *   ]}
 *   keys={['name', 'preview']}
 *   renderParts={{
 *     tableHead: {
 *       name: () => 'Token',
 *       preview: () => 'Preview',
 *     },
 *     tableCell: {
 *       preview: (value) => <Piv style={{ background: String(value) }} />,
 *     },
 *   }}
 * />
 */
// kit 原样包装泛型核心；这里恢复Row 与列及渲染器的调用关联。
export const Table = kit<
  TableProps<TableDataRow, PropertyKey>,
  typeof tablePropsDefinition
>(
  {
    name: 'Table',
    description: '按列展示记录',
    availableProps: tablePropsDefinition,
  },
  <Row, ColumnKey extends PropertyKey = keyof Row>(
    props: TableProps<Row, ColumnKey>,
  ) => {
    // keys 是表格结构的来源；renderParts 只改变内容，不改变结构层级。
    const columnKeys = stateView(props.data).map((data) =>
      props.keys
        ? val(props.keys)
        : (pickTableColumnKeys(data) as unknown as ColumnKey[]),
    )

    return (
      <Piv class="Table">
        <Piv as="table">
          <Piv as="thead">
            <Piv as="tr">
              <For each={val(columnKeys)}>
                {(columnKey) => (
                  <Piv
                    as="th"
                    htmlProps={{ 'data-compact': props.compact }}
                    style={{
                      '--table-column-width':
                        props.columnWidths?.[columnKey] ?? 'auto',
                      '--table-column-min-width':
                        props.columnMinWidths?.[columnKey] === undefined
                          ? '0px'
                          : `${props.columnMinWidths[columnKey]}px`,
                    }}
                  >
                    {toJSX(
                      props.renderParts?.tableHead?.[columnKey]?.(columnKey) ??
                        columnKey,
                    )}
                  </Piv>
                )}
              </For>
            </Piv>
          </Piv>
          <Piv as="tbody">
            <For each={val(props.data)}>
              {(row, index) => (
                <Piv as="tr">
                  <For each={val(columnKeys)}>
                    {(columnKey) => {
                      const intensity = stateView(
                        () =>
                          props.cellIntensity?.[columnKey]?.(row, index()) ?? 0,
                      )
                      return (
                        <Piv
                          as="td"
                          htmlProps={{
                            'attr:title': () =>
                              props.cellTitle?.[columnKey]?.(row, index()),
                            'data-intensity':
                              !!props.cellIntensity?.[columnKey],
                            'data-compact': props.compact,
                          }}
                          style={{
                            '--table-column-width':
                              props.columnWidths?.[columnKey] ?? 'auto',
                            '--table-column-min-width':
                              props.columnMinWidths?.[columnKey] === undefined
                                ? '0px'
                                : `${props.columnMinWidths[columnKey]}px`,
                            '--table-cell-intensity': intensity,
                          }}
                        >
                          {toJSX(
                            props.renderParts?.tableCell?.[columnKey]?.(
                              row[
                                columnKey as unknown as keyof Row
                              ] as TableCellValue<Row, typeof columnKey>,
                              columnKey,
                              row,
                              index(),
                            ) ??
                              (row[
                                columnKey as unknown as keyof Row
                              ] as JSXable),
                          )}
                        </Piv>
                      )
                    }}
                  </For>
                </Piv>
              )}
            </For>
          </Piv>
        </Piv>
      </Piv>
    )
  },
) as TableComponent

/**
 * 从第一行对象读取列 key。
 * Table 只把对象字段当作列来源，不在这里引入独立列配置系统。
 */
function pickTableColumnKeys<Row>(data: Row[]) {
  return Object.keys(data[0] ?? {}) as Array<keyof Row & string>
}
