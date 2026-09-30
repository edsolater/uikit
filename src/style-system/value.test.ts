/** 验证 Value 的数组输出规则与可变内容。 */
import { expect, test } from 'vitest'
import { condition } from './condition'
import { compileRules } from './css-root'
import { arraySequenceToCSSString, value, type ValueData } from './value'
import { valueList, valueSequence } from './pieces/contents/atom-creators/list'

test('数组 Value 默认逗号输出，空项不占分隔位置，空格规则仍可选', () => {
  const css = compileRules([
    [[condition('.ArrayValue')], 'box-shadow', value(['1px 2px red', undefined, '3px 4px blue'])],
    [[condition('.ArrayValue')], 'padding', value([1, undefined, 2], { toCSSString: arraySequenceToCSSString })],
  ])
  expect(css).toContain('box-shadow: 1px 2px red, 3px 4px blue;')
  expect(css).toContain('padding: 1 2;')
})

test('数组 Value 的子内容逐项编译，修改 content 后按新内容遍历', () => {
  const output = value<ValueData[]>([{ compile: () => '2px' }, '3px'], { toCSSString: arraySequenceToCSSString })
  expect(compileRules([[[condition('.ChangingValue')], 'padding', output]])).toContain('padding: 2px 3px;')
  output.content = [{ compile: () => '4px' }, '5px']
  expect(compileRules([[[condition('.ChangingValue')], 'padding', output]])).toContain('padding: 4px 5px;')
})

test('Value 的显式 dependencies 在当前声明位置编译', () => {
  const nested = { compile: () => '8px' }
  const output = value('unused', {
    dependencies: [nested],
    toCSSString: (_, resolve) => resolve(nested),
  })
  expect(output.dependencies).toEqual([nested])
  expect(compileRules([[[condition('.ExplicitDependencies')], 'width', output]])).toContain('width: 8px;')
})

test('业务可给数值 Value 指定输出规则，数组规则保持输入形状', () => {
  const doubled = value(3, { toCSSString: (number: number) => String(number * 2) })
  expect(compileRules([[[condition('.NumericValue')], 'z-index', doubled]])).toContain('z-index: 6;')
  const list = value(['1px'], { toCSSString: arraySequenceToCSSString })
  if (false) {
    // @ts-expect-error 数组输出规则绑定数组形状，不能替换成标量。
    list.content = '2px'
  }
  list.content = ['2px', '3px']
  expect(compileRules([[[condition('.ArrayShape')], 'padding', list]])).toContain('padding: 2px 3px;')
})

test('数组输出规则没有可输出项时省略声明', () => {
  const css = compileRules([
    [[condition('.EmptyArray')], 'box-shadow', value([undefined, undefined])],
  ])
  expect(css).not.toContain('box-shadow:')
})

test('嵌套数组、列表 Value、零与 false 按层解析，null 和 undefined 跳过', () => {
  const css = compileRules([
    [[condition('.NestedValue')], 'box-shadow', valueList(
      valueSequence('1px', '2px', 'red'),
      valueSequence('3px', '4px', 'blue'),
    )],
    [[condition('.NestedValue')], '--nested', value([0, false, undefined, null, ['a', 0]])],
  ])
  expect(css).toContain('box-shadow: 1px 2px red, 3px 4px blue;')
  expect(css).toContain('--nested: 0, false, a, 0;')
})

test('嵌套 compile 结果按原位置读取，自定义输出规则也可读取各类子项', () => {
  const css = compileRules([
    [[condition('.ReadValue')], '--compiled', value(['first', [{ compile: () => 'second' }]])],
    [[condition('.ReadValue')], '--custom', value([false, [1, 2], { label: 'plain' }], {
      toCSSString: (items, resolve) => items.map(resolve).join(' | '),
    })],
  ])
  expect(css).toContain('--compiled: first, second;')
  expect(css).toContain('--custom: false | 1, 2 | [object Object];')
})

test('空数组与 null 不输出，空字符串作为现存内容输出，循环数组可控报错', () => {
  const css = compileRules([
    [[condition('.EmptyKinds')], '--empty-array', value([])],
    [[condition('.EmptyKinds')], '--null', value(null)],
    [[condition('.EmptyKinds')], '--empty-string', value([''])],
  ])
  expect(css).not.toContain('--empty-array:')
  expect(css).not.toContain('--null:')
  expect(css).toContain('--empty-string: ;')
  const cyclic: unknown[] = []
  cyclic.push(cyclic)
  expect(() => compileRules([[[condition('.CycleValue')], '--cycle', value(cyclic)]]))
    .toThrow('Value 数组存在循环引用')
})
