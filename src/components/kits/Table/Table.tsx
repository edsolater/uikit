/**
 * Table 是对象记录的语义表格组件。
 *
 * 将对象记录呈现为语义表格，排序、筛选与分页由调用方组织。
 *
 * 内容部件替换保留原始记录，不改变表格的原生结构。
 */
import { For, stateView, val, type Source } from '@/foundation'
import { Piv } from '../../Piv/Piv'
import { kit, type KitComponent } from '../../tools/kit'

import { toJSX, type JSXable } from '../../tools/toJSX'
import { bindStyleConfig } from '../../tools/styleConfig'

import {
  tablePropDefinition,
  componentName,
  type TableProps,
  type TableController,
  type TableComponent,
} from './Table.prop'
import { tableStyleConfig, tableCellStyleConfig } from './Table.style'

/** 运行实现读取同构记录，具体字段类型由公开泛型入口保持。 */
type TableDataRow = Record<PropertyKey, unknown>

/**
 * 按列维护原生表格结构，内容渲染器取得原始行和值。
 */
const tableComponent: KitComponent<{
  props: TableProps<TableDataRow, PropertyKey>
  controller: TableController<TableDataRow, PropertyKey>
}> = kit(
  {
    name: componentName,
    componentDescription: '按列展示记录',
    propDefinition: tablePropDefinition,
    styleConfig: tableStyleConfig,
  },
  (props, { name }) => {
    // keys 是表格结构的来源；renderParts 只改变内容，不改变结构层级。
    const columnKeys = stateView(props.data).map((data) =>
      props.keys ? val(props.keys) : pickTableColumnKeys(data),
    )

    /**
     * 将当前列的配置来源与业务强度交给单元格样式解释，保留来源的持续读取。
     */
    const bindCellStyle = (
      columnKey: PropertyKey,
      intensity?: Source<number | null | undefined>,
    ) =>
      bindStyleConfig(tableCellStyleConfig, {
        get styleConfig() {
          const config = val(props.styleConfig)
          return {
            width: val(config?.columnWidths)?.[columnKey],
            minWidth: val(config?.columnMinWidths)?.[columnKey],
            intensity,
          }
        },
      })

    return (
      <Piv shadowProps={props} class={name}>
        <Piv as="table">
          <Piv as="thead">
            <Piv as="tr">
              <For each={val(columnKeys)}>
                {(columnKey) => {
                  // 列结构保持稳定，渲染器替换在内容消费时读取。
                  const headContent = stateView(() => {
                    const renderHead = props.renderParts?.tableHead?.[
                      columnKey
                    ] as ((key: PropertyKey) => JSXable) | undefined
                    return toJSX(renderHead?.(columnKey) ?? columnKey)
                  })
                  return (
                    <Piv as="th" shadowProps={bindCellStyle(columnKey)}>
                      {headContent}
                    </Piv>
                  )
                }}
              </For>
            </Piv>
          </Piv>
          <Piv as="tbody">
            <For each={val(props.data)}>
              {(row, index) => (
                <Piv as="tr">
                  <For each={val(columnKeys)}>
                    {(columnKey) => {
                      // 同一行列的内容持续读取当前渲染器，保留 key 与值的分发关联。
                      const cellContent = stateView(() => {
                        const renderCell = props.renderParts?.tableCell?.[
                          columnKey
                        ] as
                          | ((
                              value: unknown,
                              key: PropertyKey,
                              row: TableDataRow,
                              index: number,
                            ) => JSXable)
                          | undefined
                        return toJSX(
                          renderCell?.(
                            row[columnKey],
                            columnKey,
                            row,
                            index(),
                          ) ?? (row[columnKey] as JSXable),
                        )
                      })
                      const intensity = stateView(() =>
                        props.cellIntensity?.[columnKey]?.(row, index()),
                      )
                      return (
                        <Piv
                          as="td"
                          shadowProps={bindCellStyle(columnKey, intensity)}
                          htmlProps={{
                            'attr:title': () =>
                              props.cellTitle?.[columnKey]?.(row, index()),
                            get 'data-intensity'() {
                              return !!props.cellIntensity?.[columnKey]
                            },
                          }}
                        >
                          {cellContent}
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
)

/**
 * 公开记录表格，保留行、列、内容渲染器及 ref 的关联。
 */
export const Table: TableComponent = tableComponent as TableComponent

/**
 * 从第一行对象读取列 key。
 * Table 只把对象字段当作列来源，不在这里引入独立列配置系统。
 */
function pickTableColumnKeys<Row>(data: Row[]) {
  return Object.keys(data[0] ?? {}) as Array<keyof Row & string>
}
