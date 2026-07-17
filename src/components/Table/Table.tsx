/**
 * 这个文件定义基础表格组件 Table，是对象队列进入语义化 table 的组件根。
 * 它负责从第一行对象的 key 推导列结构，并统一生成 table、thead、tbody、tr、th、td。
 * 它不负责排序、筛选、分页、虚拟滚动或业务数据解释，也不让业务组件手写表格 DOM 结构。
 * 调用方只提供已经整理好的同构数据；需要局部改写表头或单元格内容时，通过 renderParts 提供纯渲染器。
 */
import { type Stringable } from '@edsolater/fnkit'
import { For } from 'solid-js'
import { toJSX, type JSXable } from '../../component-utils/toJSX'
import { toStateView, val, type Source } from '../../hooks'
import { Piv } from '../Piv'

type TableDataRow = Record<string, Stringable>

/**
 * Table 的输入数据与渲染部件配置。
 */
export type TableProps<Row extends TableDataRow = TableDataRow> = {
  /** 同构对象队列；第一行对象的 key 决定默认列顺序，允许接收动态派生值。 */
  data: Source<Row[]>

  /** 参与显示的对象 key；未提供时使用第一行对象的全部 key，允许接收动态派生值。 */
  keys?: Source<(keyof Row)[]>

  /** 纯内容渲染器集合，不改变 Table 对语义表格结构的控制权。 */
  renderParts?: {
    /** 将当前单元格值和它所属的对象 key 渲染为单元格内容。 */
    tableCell?: {
      [ColumnKey in keyof Row]?: (value: Row[ColumnKey], columnKey: ColumnKey) => JSXable
    }

    /** 将当前对象 key 渲染为表头内容。 */
    tableHead?: {
      [ColumnKey in keyof Row]?: (columnKey: ColumnKey) => JSXable
    }
  }
}

/**
 * Table 是 UIKit 里“对象队列 -> 语义化表格结构”的基础组件节点。
 * 它接收同构对象数组，把对象 key 当作列来源，把每个对象当作一行。
 * `keys` 只裁剪和排序列；`renderParts` 只改写表头或单元格内容，不接管 table 结构。
 * `data` 和 `keys` 可以是普通值，也可以是继续传递的动态值，Table 会在最终渲染位置消费当前值。
 *
 * @example
 * ```tsx
 * <Table
 *   data={[
 *     { name: '--color-action', preview: 'var(--color-action)' },
 *     { name: '--color-surface-low', preview: 'var(--color-surface-low)' },
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
 * ```
 */
export function Table<Row extends TableDataRow>(props: TableProps<Row>) {
  
  // keys 是表格结构的来源；renderParts 只改变内容，不改变结构层级。
  const columnKeys = toStateView(props.data).map((data) => (props.keys ? val(props.keys) : pickTableColumnKeys(data)))

  return (
    <Piv as="table">
      <Piv as="thead">
        <Piv as="tr">
          <For each={val(columnKeys)}>
            {(columnKey) => <Piv as="th">{toJSX(props.renderParts?.tableHead?.[columnKey]?.(columnKey) ?? columnKey)}</Piv>}
          </For>
        </Piv>
      </Piv>
      <Piv as="tbody">
        <For each={val(props.data)}>
          {(row) => (
            <Piv as="tr">
              <For each={val(columnKeys)}>
                {(columnKey) => (
                  <Piv as="td">
                    {toJSX(props.renderParts?.tableCell?.[columnKey]?.(row[columnKey], columnKey) ?? row[columnKey])}
                  </Piv>
                )}
              </For>
            </Piv>
          )}
        </For>
      </Piv>
    </Piv>
  )
}

/**
 * 从第一行对象读取列 key。
 * Table 只把对象字段当作列来源，不在这里引入独立列配置系统。
 */
function pickTableColumnKeys<Row extends TableDataRow>(data: readonly Row[]) {
  return Object.keys(data[0] ?? {}) as Array<keyof Row & string>
}
