import { token, type TokenData } from '../token'
/** 验证 Token 的数组输出规则与可变内容。 */
import { expect, test } from 'vitest'
import { condition } from '../condition'
import { compileRules } from '../css-root'
import type { Rules } from '../rule'
import { valueList, valueSequence } from '../pieces/contents/atom-creators/list'

test('数组 Token 默认逗号输出，空项不占分隔位置，空格规则仍可选', () => {
  const css = compileRules([
    [[condition('.ArrayValue')], 'box-shadow', token({ default: ['1px 2px red', undefined, '3px 4px blue'] })],
    [[condition('.ArrayValue')], 'padding', token({ default: [1, undefined, 2] }, { toCSSString: arraySequenceToCSSString })],
  ])
  expect(css).toContain('box-shadow: 1px 2px red, 3px 4px blue;')
  expect(css).toContain('padding: 1 2;')
})

test('数组 Token 的子内容逐项编译，修改 content 后按新内容遍历', () => {
  const output = token<TokenData[]>({ default: [{ onCompile: (context, controller) => { controller.setContent(context, '2px') } }, '3px'] }, { toCSSString: arraySequenceToCSSString })
  expect(compileRules([[[condition('.ChangingValue')], 'padding', output]])).toContain('padding: 2px 3px;')
  output.default = [{ onCompile: (context, controller) => { controller.setContent(context, '4px') } }, '5px']
  expect(compileRules([[[condition('.ChangingValue')], 'padding', output]])).toContain('padding: 4px 5px;')
})

test('Token 的显式 dependencies 在当前声明位置编译', () => {
  const nested = { onCompile: (context, controller) => { controller.setContent(context, '8px') } }
  const output = token('unused', {
    dependencies: [nested],
    toCSSString: (_, resolve) => resolve(nested),
  })
  expect(output.dependencies).toEqual([nested])
  expect(compileRules([[[condition('.ExplicitDependencies')], 'width', output]])).toContain('width: 8px;')
})

test('普通函数组合新内容时显式复用格式与资源，独立消费不丢扫描机会', () => {
  const dependency = token('dependency', {
    onFirstScan: () => [[['.DurationDependency'], 'display', 'block']],
  })
  const original = token<number>(200, {
    toCSSString: milliseconds => `${milliseconds}ms`,
    dependencies: [dependency],
    onFirstScan: () => [[['.DurationActivation'], 'visibility', 'visible']],
  })
  const changed = token(400, { toCSSString: milliseconds => `${milliseconds}ms`, dependencies: [dependency], onFirstScan: original.onFirstScan })
  for (const includeOriginal of [true, false]) {
    const source: Rules = [[['.ChangedDuration'], 'transition-duration', changed]]
    if (includeOriginal) source.push([['.OriginalDuration'], 'transition-duration', original])
    const css = compileRules(source)
    expect(css).toContain('transition-duration: 400ms;')
    expect(css.includes('transition-duration: 200ms;')).toBe(includeOriginal)
    expect(css).toContain('.DurationDependency')
    expect(css).toContain('display: block;')
    expect(css).toContain('.DurationActivation')
    expect(css).toContain('visibility: visible;')
  }
})

test('业务可给数值 Token 指定输出规则，数组规则保持输入形状', () => {
  const doubled = token(3, { toCSSString: (number: number) => String(number * 2) })
  expect(compileRules([[[condition('.NumericValue')], 'z-index', doubled]])).toContain('z-index: 6;')
  const list = token<string[]>({ default: ['1px'] }, { toCSSString: arraySequenceToCSSString })
  if (false) {
    // @ts-expect-error 数组输出规则绑定数组形状，不能替换成标量。
    list.default = '2px'
  }
  list.default = ['2px', '3px']
  expect(compileRules([[[condition('.ArrayShape')], 'padding', list]])).toContain('padding: 2px 3px;')
})

test('数组输出规则没有可输出项时省略声明', () => {
  const css = compileRules([
    [[condition('.EmptyArray')], 'box-shadow', token({ default: [undefined, undefined] })],
  ])
  expect(css).not.toContain('box-shadow:')
})

test('嵌套数组、列表 Token、零与 false 按层解析，null 和 undefined 跳过', () => {
  const css = compileRules([
    [[condition('.NestedValue')], 'box-shadow', valueList(
      valueSequence('1px', '2px', 'red'),
      valueSequence('3px', '4px', 'blue'),
    )],
    [[condition('.NestedValue')], '--nested', token({ default: [0, false, undefined, null, ['a', 0]] })],
  ])
  expect(css).toContain('box-shadow: 1px 2px red, 3px 4px blue;')
  expect(css).toContain('--nested: 0, false, a, 0;')
})

test('嵌套 onCompile 结果按原位置读取，自定义输出规则也可读取各类子项', () => {
  const css = compileRules([
    [[condition('.ReadValue')], '--compiled', token({ default: ['first', [{ onCompile: (context, controller) => { controller.setContent(context, 'second') } }]] })],
    [[condition('.ReadValue')], '--custom', token({ default: [false, [1, 2], { label: 'plain' }] }, {
      toCSSString: (items, resolve) => items.map(resolve).join(' | '),
    })],
  ])
  expect(css).toContain('--compiled: first, second;')
  expect(css).toContain('--custom: false | 1, 2 | [object Object];')
})

test('空数组与 null 不输出，空字符串作为现存内容输出，循环数组可控报错', () => {
  const css = compileRules([
    [[condition('.EmptyKinds')], '--empty-array', token({ default: [] })],
    [[condition('.EmptyKinds')], '--null', token(null)],
    [[condition('.EmptyKinds')], '--empty-string', token({ default: [''] })],
  ])
  expect(css).not.toContain('--empty-array:')
  expect(css).not.toContain('--null:')
  expect(css).toContain('--empty-string: ;')
  const cyclic: unknown[] = []
  cyclic.push(cyclic)
  expect(() => compileRules([[[condition('.CycleValue')], '--cycle', token({ default: cyclic })]]))
    .toThrow('循环')
})

/** 本用例选择空格序列输出，空项不占位置。 */
const arraySequenceToCSSString = (items, resolve) => items.map(resolve).filter(item => item !== undefined).join(' ')
