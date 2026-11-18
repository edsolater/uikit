/**
 * 样式快捷方式的来源与冲突验证。
 *
 * 经真实聚合和绑定入口检查唯一解释结果及调用次数。
 *
 * 防止字段定义顺序替代输入顺序，或快捷方式绕过显式覆盖。
 */
import { expect, test, vi } from 'vitest'
import { createState, flush, type Source } from '@/foundation'
import { parseStyleConfigProps } from './parseStyleConfigProps'
import { bindStyleConfig, type StyleConfig } from './styleConfig'

type Direction = 'row' | 'column'
type DirectionConfig = {
  $direction?: Direction
  $row?: boolean
  $col?: boolean
}
type Input = Record<string, unknown> & {
  $styleConfig?: Source<Record<string, unknown> | undefined>
}

const cases: { name: string; input: Input; expected: Direction | undefined }[] =
  [
    {
      name: '直接纵排',
      input: { $col: true },
      expected: 'column',
    },
    {
      name: '直接横排',
      input: { $row: true },
      expected: 'row',
    },
    {
      name: '直接快捷后纵排',
      input: { $row: true, $col: true },
      expected: 'column',
    },
    {
      name: '直接快捷后横排',
      input: { $col: true, $row: true },
      expected: 'row',
    },
    {
      name: '直接主字段先出现仍优先',
      input: { $direction: 'column', $row: true },
      expected: 'column',
    },
    {
      name: '直接主字段后出现仍优先',
      input: { $col: true, $direction: 'row' },
      expected: 'row',
    },
    {
      name: '显式快捷高于直接主字段',
      input: { $direction: 'column', $styleConfig: { $row: true } },
      expected: 'row',
    },
    {
      name: '显式实际顺序不沿合并键位置',
      input: {
        $col: true,
        $row: true,
        $styleConfig: { $row: true, $col: true },
      },
      expected: 'column',
    },
    {
      name: '显式反向顺序选横排',
      input: {
        $row: true,
        $col: true,
        $styleConfig: { $col: true, $row: true },
      },
      expected: 'row',
    },
    {
      name: '显式同名false遮盖低层',
      input: { $col: true, $styleConfig: { $col: false } },
      expected: undefined,
    },
    {
      name: '显式同名undefined遮盖低层',
      input: { $col: true, $styleConfig: { $col: undefined } },
      expected: undefined,
    },
    {
      name: '未激活的显式横排不强制反向',
      input: { $direction: 'column', $styleConfig: { $row: false } },
      expected: 'column',
    },
    {
      name: '显式主字段undefined清空整组',
      input: { $col: true, $styleConfig: { $direction: undefined } },
      expected: undefined,
    },
    {
      name: '直接主字段undefined回落快捷',
      input: { $direction: undefined, $col: true },
      expected: 'column',
    },
    {
      name: '仅显式对象快捷后纵排',
      input: { $styleConfig: { $row: true, $col: true } },
      expected: 'column',
    },
    {
      name: '仅显式对象快捷后横排',
      input: { $styleConfig: { $col: true, $row: true } },
      expected: 'row',
    },
    {
      name: '同显式层主字段优先快捷',
      input: { $styleConfig: { $direction: 'row', $col: true } },
      expected: 'row',
    },
  ]

test.each(cases)('$name 只应用最终效果一次', ({ input, expected }) => {
  const interpret = vi.fn((_value: Direction) => {})
  // 特意先列快捷再列效果函数，结果仍由输入来源和出现顺序决定。
  const definition = {
    $col: { $direction: 'column' },
    $row: { $direction: 'row' },
    $direction: interpret,
  } satisfies StyleConfig<DirectionConfig>
  const declaration = bindStyleConfig(definition, parseStyleConfigProps(input))
  void declaration.style
  expect(interpret).toHaveBeenCalledTimes(expected === undefined ? 0 : 1)
  if (expected !== undefined) expect(interpret).toHaveBeenCalledWith(expected)
})

test('快捷字段来源的false与undefined不复活旧值，替换普通配置只消费当前层', () => {
  const interpret = vi.fn((_value: Direction) => {})
  const column = createState<boolean | undefined>(true)
  const explicit = createState<Record<string, unknown> | undefined>()
  const definition = {
    $direction: interpret,
    $row: { $direction: 'row' },
    $col: { $direction: 'column' },
  } satisfies StyleConfig<DirectionConfig>
  const declaration = bindStyleConfig(
    definition,
    parseStyleConfigProps({ $col: column, $styleConfig: explicit }),
  )
  void declaration.style
  expect(interpret).toHaveBeenLastCalledWith('column')
  interpret.mockClear()
  column.set(false)
  flush()
  void declaration.style
  expect(interpret).not.toHaveBeenCalled()
  column.set(undefined)
  flush()
  void declaration.style
  expect(interpret).not.toHaveBeenCalled()
  column.set(true)
  flush()
  void declaration.style
  expect(interpret).toHaveBeenCalledExactlyOnceWith('column')
  interpret.mockClear()
  explicit.set({ $col: false })
  flush()
  void declaration.style
  expect(interpret).not.toHaveBeenCalled()
  explicit.set({ $col: undefined })
  flush()
  void declaration.style
  expect(interpret).not.toHaveBeenCalled()
  explicit.set({ $row: true })
  flush()
  void declaration.style
  expect(interpret).toHaveBeenCalledExactlyOnceWith('row')
  interpret.mockClear()
  const replacement = bindStyleConfig(definition, {
    $styleConfig: { $col: true, $row: true },
  })
  void replacement.style
  expect(interpret).toHaveBeenCalledExactlyOnceWith('row')
})

test('工具复用显式映射的其他值域，不拥有Flow方向知识', () => {
  const interpret = vi.fn((_value: 'left' | 'right') => {})
  const definition = {
    $align: interpret,
    $start: { $align: 'left' },
    $end: { $align: 'right' },
  } satisfies StyleConfig<{
    $align?: 'left' | 'right'
    $start?: boolean
    $end?: boolean
  }>
  const input: Input = { $end: true }
  const declaration = bindStyleConfig(definition, parseStyleConfigProps(input))
  void declaration.style
  expect(interpret).toHaveBeenCalledExactlyOnceWith('right')
})

test('普通handler按定义顺序各调用一次，合法空值保持原值', () => {
  const values: [string, unknown][] = []
  const definition = {
    $label: value => values.push(['文字', value]),
    $active: value => values.push(['启用', value]),
    $count: value => values.push(['数量', value]),
    $nullable: value => values.push(['空值', value]),
  } satisfies StyleConfig<{
    $label?: string
    $active?: boolean
    $count?: number
    $nullable?: string | null
  }>
  const declaration = bindStyleConfig(definition, {
    $styleConfig: { $nullable: null, $count: 0, $active: false, $label: '' },
  })
  void declaration.style
  expect(values).toEqual([
    ['文字', ''],
    ['启用', false],
    ['数量', 0],
    ['空值', null],
  ])
})

/**
 * 显式快捷表与原解释函数共享值域，不生成未声明的名字。
 */
function verifyShortcutContract() {
  type Config = {
    $align?: 'left' | 'right'
    $start?: boolean
    $center?: boolean
  }
  const invalidValue = {
    $align: _value => {},
    $start: { $align: 'left' },
    // @ts-expect-error 显式映射值必须属于目标原值域。
    $center: { $align: 'middle' },
  } satisfies StyleConfig<Config>
  const invalidTarget = {
    $align: _value => {},
    $start: { $align: 'left' },
    // @ts-expect-error 快捷不能指向布尔快捷字段形成链。
    $center: { $start: true },
  } satisfies StyleConfig<Config>
  const invalidPrimary = {
    // @ts-expect-error 普通字符串字段必须提供函数效果，不能再声明快捷映射。
    $align: { $align: 'left' },
    $start: { $align: 'left' },
    $center: { $align: 'right' },
  } satisfies StyleConfig<Config>
  void [invalidValue, invalidTarget, invalidPrimary]
}
void verifyShortcutContract
