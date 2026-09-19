/** 验证登记、按 Subject Condition 名称读取 Value、依赖闭包与完整 CSS 输出。 */
import { afterEach, expect, test, vi } from 'vitest'
import { subjectCondition } from '../subject-conditions'
import { compileCSS } from '../core/css-root'
import { rule, rules, type Rules, type RuleValue, type RulesHandle, type DeclarationGroup, type Declarations } from '../core/css-rule'
import { condition, media, type ConditionInput } from '../core/css-condition'
import { key } from '../core/css-key'
import { declare } from '../core/css-declaration'
import { value, type ValueBranches, type ValueInput } from '../core/css-value'
import { variable } from '../core/css-variable'
import { $margin, $marginLeft } from '../properties/margin'
import { $padding } from '../properties/padding'
import { $border } from '../properties/border'
import { $font } from '../properties/font'
import { $color } from '../properties/color'
import { $transition } from '../properties/transition'
import { $boxShadow } from '../properties/box-shadow'
import { shadowValue } from '../values/shadow'
import { calcMultiply } from '../values/functions/calc'
import { colorMix } from '../values/functions/color-mix'
import { cssFunction } from '../values/functions/custom'
import { animationName, animationValue } from '../values/animation'
import { valueList, valueSequence } from '../values/list'
import { fontValue } from '../values/font'
import { transitionValue } from '../values/transition'
import { contentLayout } from '../mixins/content'
import { boundary } from '../mixins/structure'
import { clickable } from '../mixins/interaction'

subjectCondition('testHover', condition('&:hover'))
subjectCondition('testActive', condition('&:active'))
subjectCondition('testMedia', media('(width > 1px)'))
subjectCondition('revisionA', condition('&[data-a]'))
subjectCondition('revisionB', condition('&[data-b]'))

const handles: RulesHandle[] = []
/** 保留正式登记返回的句柄，交给 afterEach 清理；不改变句柄能力。 */
function keep<T extends RulesHandle>(handle: T): T {
  handles.push(handle)
  return handle
}
afterEach(() => {
  for (const handle of handles.splice(0)) handle.remove()
  vi.restoreAllMocks()
})

test('三项 Rule 递归继承地址，普通 Rule 的重复条件原样保留', () => {
  const child: Rules = [[[condition('&:hover')], undefined, 'blue']]
  const source: Rules = [[[condition('.example'), condition('&:hover')], 'color', child]]
  keep(rule(undefined, undefined, source))
  expect(compileCSS()).toBe('.example {\n&:hover {\n&:hover {\ncolor: blue;\n}\n}\n}')
})

test('同址声明保留顺序，删除句柄不影响其他登记', () => {
  const first = keep(rule('.example', 'color', 'red'))
  keep(rule('.example', 'display', 'grid'))
  const second = keep(rule('.example', key('color'), 'blue'))
  expect(compileCSS()).toBe('.example {\ncolor: red;\ndisplay: grid;\ncolor: blue;\n}')
  first.remove()
  expect(() => first.replace('black')).toThrow('已删除')
  second.replace('green')
  expect(compileCSS()).toContain('color: green')
  second.remove()
  expect(compileCSS()).not.toContain('color:')
  expect(() => second.replace('purple')).toThrow()
})

test('同一内容重复登记，旧句柄不能删除新登记', () => {
  const foreground = value('red')
  const handle = keep(rule('.example', 'color', foreground))
  keep(rule('.example', 'color', foreground))
  handle.remove()
  expect(compileCSS()).toContain('color: red')
})

test('Condition header 决定真实地址，不同 CSS 条件分别保留', () => {
  keep(rule(['.example', condition('&:hover')], 'color', 'red'))
  keep(rule(['.example', condition('&:where(:hover)')], 'color', 'blue'))
  const css = compileCSS()
  expect(css).toContain('&:hover {\ncolor: red;')
  expect(css).toContain('&:where(:hover) {\ncolor: blue;')
})

test('Value 分支集合统一生成相同 CSS', () => {
  /** 按需提供测试分支。 */
  function* entries(): IterableIterator<[string, string]> {
    yield ['testHover', 'blue']
    yield ['testActive', 'green']
  }
  const expected: [string, string][] = [['testHover', 'blue'], ['testActive', 'green']]
  const inputs: ValueBranches[] = [
    { testHover: 'blue', testActive: 'green' },
    new Map(expected),
    new Set(expected),
    expected,
    entries(),
  ]
  inputs.forEach((input, index) => keep(rule(`.branches-${index}`, 'color', value('red', input))))

  const css = compileCSS()
  inputs.forEach((_, index) => {
    expect(css).toContain(`.branches-${index} {\ncolor: red;\n&:hover {\ncolor: blue;\n}\n&:active {\ncolor: green;\n}\n&:hover {\n&:active {\ncolor: green;\n}\n}\n}`)
  })
})

test('不同 Condition 对象的相同 header 共享 Rule、Value 与 Variable 地址', () => {
  const firstHover = condition('&:hover')
  const sameHover = condition('&:hover')
  keep(rule(['.same-rule', firstHover], 'color', 'red'))
  keep(rule(['.same-rule', sameHover], 'color', 'blue'))
  const nested = value('black', [['testHover', 'navy']])
  keep(rule('.same-value', 'color', value('red', [['testHover', nested]])))
  const foreground = variable('color-condition-identity', {
    fallback: value('black', [['testHover', 'gray']]),
  })
  keep(rules('.same-variable', [[foreground, [['testHover', 'silver']]], [$color, foreground]]))

  const css = compileCSS()
  expect(css).toContain('.same-rule {\n&:hover {\ncolor: red;\ncolor: blue;\n}\n}')
  expect(css).toContain('.same-value {\ncolor: red;\n&:hover {\ncolor: navy;')
  expect(css).toContain('--color-condition-identity: black;')
  expect(css).toContain('&:hover {\n--color-condition-identity: silver;')
  expect(css).toContain('color: var(--color-condition-identity, black);')
})

test('声明二元数组只配对 Key 与 content，Variable 可同时作为声明 Key 和引用 Value', () => {
  const foreground = variable('local-foreground', { fallback: 'black' })
  expect(declare(foreground, 'red')).toEqual([foreground, 'red'])
  expect(declare($color, foreground)).toEqual([$color, foreground])
  keep(rules('.example', [[foreground, 'red'], [$color, foreground]]))
  expect(compileCSS()).toContain('--local-foreground: red;\ncolor: var(--local-foreground, black);')
})

test('声明对象保留智能 RHS，且能与 Variable 目标在同一批输入中协作', () => {
  const fallback = value('black', [['testHover', 'gray']])
  const foreground = variable('mixed-input-foreground', {
    fallback,
    root: { value: 'navy', dark: 'white' },
    registration: { syntax: '<color>', inherits: true, initialValue: 'black' },
  })
  const dependency = vi.fn((): Rules => [[[condition(':root')], '--mixed-input-ready', 1]])
  const opacity = value(1, [['testHover', value(0.75, { onActive: dependency })]])
  const foregroundValue = value('red', [['testHover', 'blue']])
  const foregroundBefore = { ...foreground }
  const fallbackBefore = { ...fallback, conditions: [...fallback.conditions] }
  const opacityBefore = { ...opacity, conditions: [...opacity.conditions] }
  const foregroundValueBefore = { ...foregroundValue, conditions: [...foregroundValue.conditions] }
  const inputs: Declarations[] = [
    [
      { display: 'inline-flex', color: foreground, opacity },
      [foreground, foregroundValue],
    ],
    [
      ['display', 'inline-flex'],
      ['color', foreground],
      ['opacity', opacity],
      [foreground, foregroundValue],
    ],
  ]

  expect(dependency).not.toHaveBeenCalled()
  expect(foreground).toEqual(foregroundBefore)
  expect(fallback).toEqual(fallbackBefore)
  expect(opacity).toEqual(opacityBefore)
  expect(foregroundValue).toEqual(foregroundValueBefore)
  const outputs = inputs.map((input) => {
    const handle = rules('.MixedInput', input)
    const output = compileCSS()
    handle.remove()
    return output
  })
  expect(outputs[0]).toBe(outputs[1])
  const css = outputs[0]
  expect(css).toContain('@property --mixed-input-foreground')
  expect(css).toContain(':where(:root) {\n--mixed-input-foreground: navy;')
  expect(css).toContain('&:where([data-theme="dark"]) {\n--mixed-input-foreground: white;')
  expect(css).toContain('.MixedInput {\ndisplay: inline-flex;\ncolor: var(--mixed-input-foreground, black);\nopacity: 1;')
  expect(css).toContain('&:hover {\nopacity: 0.75;')
  expect(css).toContain('--mixed-input-foreground: red;')
  expect(css).toContain('&:hover {\n--mixed-input-foreground: blue;')
  expect(css).toContain('--mixed-input-ready: 1;')
  expect(dependency).toHaveBeenCalledTimes(2)
  expect(foreground).toEqual(foregroundBefore)
  expect(fallback).toEqual(fallbackBefore)
  expect(opacity).toEqual(opacityBefore)
  expect(foregroundValue).toEqual(foregroundValueBefore)
})

test('对象、数组、Map、Set 与一次性 Iterable 进入同一有序声明路径', () => {
  const tuples: [string, string][] = [
    ['display', 'inline-flex'],
    ['alignItems', 'center'],
    ['justifyContent', 'center'],
  ]
  let iteratorCalls = 0
  const once: DeclarationGroup = {
    *[Symbol.iterator]() {
      iteratorCalls += 1
      if (iteratorCalls > 1) throw new Error('声明 Iterable 被重复读取。')
      yield* tuples
    },
  }
  const inputs: Declarations[] = [
    { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
    tuples,
    new Map(tuples),
    new Set(tuples),
    once,
  ]
  const outputs = inputs.map((input) => {
    const handle = rules('.Inputs', input)
    const output = compileCSS()
    handle.remove()
    return output
  })
  expect(new Set(outputs)).toHaveLength(1)
  expect(outputs[0]).toBe('.Inputs {\ndisplay: inline-flex;\nalign-items: center;\njustify-content: center;\n}')
  expect(iteratorCalls).toBe(1)
})

test('声明名称统一解析已登记别名，同时保留原生与自定义属性字符串', () => {
  keep(rules('.Names', {
    alignItems: 'center',
    'future-property': 'native-value',
    '--local-property': 'custom-value',
  }))
  keep(rule('.SingleName', 'justifyContent', 'center'))
  expect(compileCSS()).toContain('.Names {\nalign-items: center;\nfuture-property: native-value;\n--local-property: custom-value;\n}')
  expect(compileCSS()).toContain('.SingleName {\njustify-content: center;\n}')
  key('test-collision-target')
  expect(() => key('testCollision-target')).toThrow('CSS Key 名称冲突：testCollisionTarget')
  expect(() => rule('.PartialName', 'testCollision-target', 'value')).toThrow('未知 CSS Key 名称：testCollision-target')
  expect(() => rules('.Unknown', { unknownAlias: 'value' })).toThrow('未知 CSS Key 名称：unknownAlias')
})

test('嵌套组合保留重复顺序、Variable 目标、内容身份与 undefined', () => {
  const local = variable('ordered-local', { fallback: 'black' })
  const content = vi.fn(() => '4px')
  const nested: Declarations = [
    { margin: '1px' },
    new Set<[string, RuleValue]>([['margin-left', '2px'], ['margin', '3px']]),
    undefined,
    [[local, 'red'], ['padding', content], ['color', local]],
  ]
  keep(rules('.Ordered', nested))
  expect(content).not.toHaveBeenCalled()
  expect(compileCSS()).toBe('.Ordered {\nmargin: 1px;\nmargin-left: 2px;\nmargin: 3px;\n--ordered-local: red;\npadding: 4px;\ncolor: var(--ordered-local, black);\n}')
  expect(content).toHaveBeenCalled()
})

test('嵌套批量声明与单项属性不会混淆', () => {
  keep(rules('.example', [[[$color, 'red'], [$padding, '1px']]]))
  expect(compileCSS()).toContain('padding: 1px')
  expect(compileCSS()).toContain('color: red')
})

test('声明组合忽略空项和 content 为 undefined 的 Declaration，不把缺失声明登记为 Rule', () => {
  expect(declare($color, undefined)).toEqual([$color, undefined])
  keep(rules('.example', [undefined, [$color, 'red'], [$font, undefined], [undefined, [$padding, '1px'], undefined]]))
  keep(rules('.omitted', [declare($color, undefined)]))
  expect(compileCSS()).toBe('.example {\ncolor: red;\npadding: 1px;\n}')
})

test('批量登记先验证整批，失败时既有条目与句柄保持有效', () => {
  const original = keep(rule('.example', 'color', 'red'))
  const invalid = [[$color, 'blue'], [{ name: 1 }, 'grid']] as unknown as Declarations
  expect(() => keep(rules('.example', invalid))).toThrow('只接受声明对象')
  expect(compileCSS()).toBe('.example {\ncolor: red;\n}')
  original.replace('green')
  expect(compileCSS()).toContain('color: green')
  const recursive: unknown[] = [[$color, 'blue']]
  recursive.push(recursive)
  expect(() => keep(rules('.example', recursive as Declarations))).toThrow('递归引用')
  expect(compileCSS()).toContain('color: green')
  const invalidProperty = [[$color, 'blue'], [{ name: 1 }, 'grid']] as unknown as Declarations
  expect(() => keep(rules('.example', invalidProperty))).toThrow()
  keep(rules('.example', [[$color, undefined]]))
  expect(() => keep(rules([null] as unknown as ConditionInput, [[$color, 'blue']]))).toThrow('Condition Path')
  expect(compileCSS()).toContain('color: green')
})

test('迭代器抛错与字符串输入整批失败，不留下已经读取的声明', () => {
  const original = keep(rule('.Atomic', 'color', 'red'))
  function* broken(): IterableIterator<[string, string]> {
    yield ['color', 'blue']
    throw new Error('读取声明失败。')
  }
  expect(() => rules('.Atomic', broken())).toThrow('读取声明失败')
  expect(() => rules('.Atomic', 'color' as unknown as Declarations)).toThrow('只接受声明对象')
  expect(compileCSS()).toBe('.Atomic {\ncolor: red;\n}')
  original.replace('green')
  expect(compileCSS()).toBe('.Atomic {\ncolor: green;\n}')
})

test('批量删除仅删除本批声明，重复声明不提前覆盖', () => {
  const batch = keep(rules('.example', [[$color, 'red'], [key('display'), 'grid'], [[$color, 'blue']]]))
  expect(compileCSS()).toBe('.example {\ncolor: red;\ndisplay: grid;\ncolor: blue;\n}')
  keep(rule('.example', 'color', 'green'))
  batch.remove()
  batch.remove()
  expect(compileCSS()).toBe('.example {\ncolor: green;\n}')
})

test('定义只保存结构；外层 default 不限制子 Value 的条件分支', () => {
  const active = vi.fn()
  const red = value('red', [['testHover', 'lightcoral'], ['testActive', 'darkred']], { onActive: active })
  const blue = value('blue', [['testHover', value(value('cyan'))]])
  const foreground = value(value(red), [['testHover', blue]])
  expect(foreground.default).toHaveProperty('default', red)
  expect(active).not.toHaveBeenCalled()
  keep(rule('.example', 'color', foreground))
  const css = compileCSS()
  expect(css).toBe('.example {\ncolor: red;\n&:hover {\ncolor: cyan;\n}\n&:active {\ncolor: darkred;\n}\n&:hover {\n&:active {\ncolor: cyan;\n}\n}\n}')
  expect(active).toHaveBeenCalledTimes(1)
})

test('同一个 Value 的 hover 与 active 各读自身属性，共享 DAG 不误报循环', () => {
  const red = value('red', [['testHover', 'lightcoral'], ['testActive', 'darkred']])
  keep(rule('.example', 'color', value('black', [['testHover', red], ['testActive', red]])))
  keep(rule('.example', 'border-color', red))
  const css = compileCSS()
  expect(css).toContain('color: lightcoral')
  expect(css).toContain('color: darkred')
  expect(css).toContain('border-color: darkred')
})

test('已登记的业务选择器与媒体名称可以形成嵌套地址', () => {
  const compact = subjectCondition('testCompact', condition('&[data-density="compact"]')).name
  const wide = subjectCondition('testWide', media('(width > 800px)')).name
  const compactSize = value('8px', [[compact, '6px']])
  const size = value('12px', [[compact, compactSize], [wide, '16px']])
  expect(size.conditions.map(([name]) => name)).toEqual([compact, wide])
  keep(rule('.example', 'gap', size))
  keep(rule('.example', 'width', calcMultiply(value('2px', [[compact, '3px']]), value(2, [[wide, 4]]))))
  const css = compileCSS()
  expect(css).toContain('&[data-density="compact"] {\ngap: 6px;')
  expect(css).toContain('@media (width > 800px) {\ngap: 16px;')
  expect(css).toContain('width: calc(2px * 2);')
  expect(css.match(/width:/g)).toHaveLength(4)
})

test('当前链再次访问实际槽位时抛错；fallback 循环也能终止', () => {
  const a = value('red')
  const b = value(a)
  a.conditions.push(['testHover', b])
  keep(rule('.example', 'color', a))
  expect(() => compileCSS()).toThrow('循环引用')
  for (const handle of handles.splice(0)) handle.remove()
  const recursive = value('red')
  recursive.default = recursive
  keep(rule('.example', 'color', recursive))
  expect(() => compileCSS()).toThrow('循环引用')
})

test('嵌套候选保留条件交集，全部候选仍检查循环', () => {
  const blue = value('blue', [['testHover', 'cyan'], ['testActive', 'navy']])
  keep(rule('.example', 'color', value('red', [['testHover', blue]])))
  expect(compileCSS()).toBe('.example {\ncolor: red;\n&:hover {\ncolor: cyan;\n&:active {\ncolor: navy;\n}\n}\n}')
  blue.conditions.push(['testActive', blue])
  expect(() => compileCSS()).toThrow('循环引用')
})

test('普通 Rules 通过结构嵌套切换属性，不进入 Value', () => {
  const base: Rules = [[undefined, 'color', 'red'], [undefined, 'display', 'grid']]
  const matched: Rules = [[undefined, 'color', 'blue']]
  keep(rule('.example', undefined, base))
  keep(rule(['.example', '&:hover'], undefined, matched))
  expect(compileCSS()).toBe('.example {\ncolor: red;\ndisplay: grid;\n&:hover {\ncolor: blue;\n}\n}')
})

test('复合值保留条件组合，重复名称的分支后写生效', () => {
  keep(rule('.example', 'width', calcMultiply(value('2px', [['testHover', '4px']]), value(2, [['testActive', 3]]))))
  expect(compileCSS()).toBe('.example {\nwidth: calc(2px * 2);\n&:hover {\nwidth: calc(4px * 2);\n}\n&:active {\nwidth: calc(2px * 3);\n}\n&:hover {\n&:active {\nwidth: calc(4px * 3);\n}\n}\n}')
  keep(rule('.same', 'width', calcMultiply(value(2, [['testHover', 3], ['testHover', 4]]), value(2, [['testHover', 5]]))))
  expect(compileCSS()).toContain('width: calc(4 * 5)')
})

test('外层分支与子 Value 的条件按中央顺序嵌套', () => {
  const amount = value(2, [['testHover', 4]])
  keep(rule('.example', 'width', value('1px', [['testActive', calcMultiply(amount, 3)]])))
  expect(compileCSS()).toBe('.example {\nwidth: 1px;\n&:active {\nwidth: calc(2 * 3);\n}\n&:hover {\n&:active {\nwidth: calc(4 * 3);\n}\n}\n}')
})

test('依赖只进入本次编译，删掉源条目后派生资源退出', () => {
  const nestedActive = vi.fn((): Rules => [[[condition(':root')], '--value-factor', 3]])
  const nested = value('3px', { onActive: nestedActive })
  const active = vi.fn((): Rules => [[[condition(':root')], '--size-example', nested]])
  const size = value('var(--size-example)', { onActive: active })
  const handle = keep(rule('.example', 'width', calcMultiply(size, size)))
  expect(active).not.toHaveBeenCalled()
  expect(compileCSS()).toContain('--value-factor: 3')
  expect(active).toHaveBeenCalledTimes(1)
  expect(nestedActive).toHaveBeenCalledTimes(1)
  compileCSS()
  expect(active).toHaveBeenCalledTimes(2)
  handle.remove()
  expect(compileCSS()).toBe('')
})

test('onActive 收到真正消费状态的地址', () => {
  const active = vi.fn()
  const distance = value('2px', [['testHover', value('4px', { onActive: active })]])
  keep(rule('.example', 'width', calcMultiply(distance, 2)))
  compileCSS()
  expect(active).toHaveBeenCalledWith(expect.objectContaining({ path: [condition('.example'), condition('&:hover')], key: 'width' }))
})

test('依赖回指同一集合终止，Rules 内容递归报错', () => {
  const dependency: Rules = []
  dependency.push([[condition('.example')], 'color', value('red', { onActive: () => dependency })])
  const handle = keep(rule(undefined, undefined, dependency))
  expect(compileCSS()).toContain('color: red')
  handle.remove()
  const recursive: Rules = []
  recursive.push([undefined, undefined, recursive])
  keep(rule(undefined, undefined, recursive))
  expect(() => compileCSS()).toThrow('递归引用')
})

test('Variable 条件默认值与局部声明共享同名 Custom Property，显式声明优先', () => {
  const hover = 'testHover'
  const active = 'testActive'
  const missing = subjectCondition('testMissing', condition('&:missing')).name
  const foreground = variable('--color-foreground-test', {
    fallback: value('black', [[hover, 'gray'], [active, 'silver']]),
    registration: { syntax: '*', inherits: true },
  })
  keep(rule('.example', foreground, value('red', [[hover, 'blue']])))
  keep(rules('.only-active', [[foreground, [[active, 'green'], [missing, 'orange']]]]))
  keep(rules('.same-active', [[foreground, [[active, 'silver']]]]))
  keep(rules('.example', [[$color, foreground]]))
  const css = compileCSS()
  expect(css).toContain('--color-foreground-test: red')
  expect(css).toContain('&:hover {\n--color-foreground-test: blue;')
  expect(css).toContain('&:active {\n--color-foreground-test: green;')
  expect(css).toContain('.same-active {\n&:active {\n--color-foreground-test: silver;')
  expect(css).toContain('&:missing {\n--color-foreground-test: orange;')
  expect(css).toContain('color: var(--color-foreground-test, black)')
  expect(css.match(/color: var\(/g)).toHaveLength(1)
  expect(css).not.toContain('--color-foreground-test-when-')
  expect(css.match(/@property --color-foreground-test/g)).toHaveLength(1)
})

test('原生简写原样保留，复合字段由内容函数编译', () => {
  keep(rules('.example', [
    [$margin, '4px'],
    [$marginLeft, '8px'],
    [$padding, valueSequence('1px', '2px', '3px')],
    [$border, valueSequence('red', '4px', 'solid')],
    [$font, fontValue({ style: 'italic', size: '16px', lineHeight: 1.5, family: 'system-ui' })],
  ]))
  keep(rules('.single', [[$padding, '4px'], [$border, 'none']]))
  const css = compileCSS()
  expect(css).toContain('margin-left: 8px')
  expect(css).toContain('margin: 4px')
  expect(css).toContain('padding: 1px 2px 3px')
  expect(css).toContain('font: italic 16px/1.5 system-ui')
  expect(css).toContain('.single {\npadding: 4px')
  expect(css).toContain('border: none')
})

test('阴影与过渡数组内容保留状态和完整语法', () => {
  const shadow = declare($boxShadow, valueList(
    shadowValue({ x: 0, y: value('2px', [['testHover', '4px']]), color: 'black' }),
    shadowValue({ x: 0, y: 0, spread: '1px', color: 'red' }),
  ))
  const timing = declare($transition, transitionValue(
    [key('opacity'), '100ms', 'ease'],
    [key('transform'), '200ms', 'linear', '30ms'],
  ))
  keep(rules('.example', [shadow, timing]))
  expect(compileCSS()).toContain('box-shadow: 0 4px black, 0 0 0 1px red')
  expect(compileCSS()).toContain('transition: opacity 100ms ease, transform 200ms linear 30ms')
})

test('动画和函数激活完整资源，同名函数替换整个定义', () => {
  const opacity = variable('--fade-opacity', { root: { value: 1 } })
  const frames: Rules = [[[condition('from')], 'opacity', 0], [[condition('to')], 'opacity', opacity]]
  keep(rule('.example', 'animation', animationValue({ name: animationName('motion-fade', frames), duration: '1s' })))
  const oldBody: Rules = [[undefined, '--old-local', '100px'], [undefined, 'result', value('16px', [['testMedia', '20px']])]]
  const nextBody: Rules = [[undefined, 'result', '24px']]
  keep(rule('.first', 'width', cssFunction('--size-example() returns <length>', oldBody)()))
  keep(rule('.second', 'width', cssFunction('--size-example() returns <length>', nextBody)()))
  const css = compileCSS()
  expect(css).toContain('@keyframes motion-fade')
  expect(css).toContain('--fade-opacity: 1')
  expect(css.match(/@function --size-example/g)).toHaveLength(1)
  expect(css).toContain('result: 24px')
  expect(css).not.toContain('--old-local')
  expect(css).not.toContain('20px')
})

test('同名函数替换时，旧函数中的条件变量默认定义一并退出', () => {
  const ratio = variable('old-function-ratio', { fallback: value(0.8, [['testMedia', 0.6]]) })
  const oldBody: Rules = [[undefined, 'result', ratio]]
  const nextBody: Rules = [[undefined, 'result', 1]]
  keep(rule('.old-function', 'opacity', cssFunction('--example-ratio() returns <number>', oldBody)()))
  keep(rule('.new-function', 'opacity', cssFunction('--example-ratio() returns <number>', nextBody)()))

  const css = compileCSS()
  expect(css.match(/@function --example-ratio/g)).toHaveLength(1)
  expect(css).not.toContain('--old-function-ratio')
  expect(css).toContain('result: 1;')
})

test('Key 只有名称；简写、详细属性和重复声明按书写顺序输出', () => {
  expect(key('padding')).toEqual({ name: 'padding' })
  handles.push(rules('.Native', [
    [key('padding'), '2px 4px'],
    ['padding-left', '8px'],
    ['padding', '10px'],
    ['future-property', 'native-value'],
  ]))
  expect(compileCSS()).toBe('.Native {\npadding: 2px 4px;\npadding-left: 8px;\npadding: 10px;\nfuture-property: native-value;\n}')
})

test('Mixin 处理方向配置，Key 不解释对象', () => {
  handles.push(rules('.Layout', [contentLayout({ padding: { left: '4px' } })]))
  expect(compileCSS()).toBe('.Layout {\npadding-left: 4px;\n}')
})

test('边界形状按需输出，省略时保留边框和焦点配置', () => {
  keep(rules('.Shape', [boundary({ radius: '999px', cornerShape: 'squircle' })]))
  keep(rules('.Boundary', [boundary({ border: ['1px', 'solid', 'transparent'], outline: { width: '2px', style: 'solid', color: 'blue', offset: '2px' } })]))
  keep(rules('.EmptyBoundary', [boundary()]))
  const css = compileCSS()
  expect(css).toContain('.Shape {\nborder-radius: 999px;\ncorner-shape: squircle;')
  expect(css).toContain('.Boundary {\nborder: 1px solid transparent;\noutline-width: 2px;\noutline-style: solid;\noutline-color: blue;\noutline-offset: 2px;')
  expect(css.match(/corner-shape:/g)).toHaveLength(1)
  expect(css).not.toContain('.EmptyBoundary')
})

test('center 由 Mixin 选择实现，独立空间配置不要求布局模式', () => {
  keep(rules('.Center', [contentLayout({ mode: 'center' })]))
  keep(rules('.Space', [contentLayout({ gap: '8px', padding: ['4px', '12px'] })]))
  expect(compileCSS()).toBe('.Center {\ndisplay: inline-flex;\nalign-items: center;\njustify-content: center;\n}\n.Space {\ngap: 8px;\npadding: 4px 12px;\n}')
})

test('可点击效果允许选择透明度且保留省略参数时的旧默认', () => {
  const original = keep(rules('.Original', [clickable()]))
  const before = compileCSS()
  expect(before).toContain('opacity: 0.48;')
  expect(before).toContain('opacity: 1;')
  original.remove()
  keep(rules('.Explicit', [clickable({ opacity: value(1, { disabled: 0.56 }) })]))
  const css = compileCSS()
  expect(css).toContain('opacity: 0.56;')
  expect(css).not.toContain('--opacity-disabled')
  expect(css).toContain('cursor: not-allowed;')
  expect(css).toContain('transform: translateY(1px);')
  expect(css).toContain('transition: background-color')
  expect(css).toContain('prefers-reduced-motion')
})

test('同一激活集合中，各 Value 都选择自身最高优先级分支', () => {
  const first = value(1, { revisionA: 2, revisionB: 5 })
  const second = value(1, { revisionB: 11, revisionA: 7 })
  handles.push(rule('.Product', 'width', calcMultiply(first, second)))
  expect(compileCSS()).toContain('&[data-a] {\n&[data-b] {\nwidth: calc(5 * 11);')
})

test('嵌套混色中缺少 active 的 Value 仍保留自己的 hover 值', () => {
  handles.push(rule('.Nested', 'color', colorMix(
    value('red', { hover: 'orange' }),
    colorMix(value('blue', { active: 'green' }), value('white', { active: 'black' })),
  )))
  expect(compileCSS()).toContain('color-mix(in oklab, orange, color-mix(in oklab, green, black))')
})

test('Variable 自动定义只改变自身，消费函数不展开', () => {
  const ratio = variable('ratio', { fallback: value(0.82, { hover: 0.72, active: 0.62 }) })
  handles.push(rule('.Variable', 'background', colorMix(['black', ratio], 'white')))
  const css = compileCSS()
  expect(ratio.kind).toBe('variable')
  expect(css.match(/background:/g)).toHaveLength(1)
  expect(css).toContain('--ratio: 0.62;')
  expect(css).toContain('calc(var(--ratio, 0.82) * 100%)')
})

test('undefined 跳过；每个句柄仅修改自己的声明', () => {
  const first = rule('.Handles', 'color', 'red')
  handles.push(first)
  const second = rule('.Handles', 'color', 'blue')
  handles.push(second)
  handles.push(rule('.Handles', 'color', undefined))
  first.replace('green')
  expect(compileCSS()).toContain('color: green;\ncolor: blue;')
  second.remove()
  expect(compileCSS()).toBe('.Handles {\ncolor: green;\n}')
})

test('函数只在编译时执行，核心按函数请求解析智能输入', () => {
  const input = value('1px', { hover: '2px' })
  const render = vi.fn((read: (input: ValueInput) => string | undefined) => `custom(${read(input)})`)
  handles.push(rule('.Function', 'width', render))
  expect(render).not.toHaveBeenCalled()
  expect(compileCSS()).toContain('width: custom(2px);')
  expect(render).toHaveBeenCalled()
})

test('Rule 中的主体名称与 Value 共享集合，普通同名 header 不被去重', () => {
  handles.push(rule(['.Subject', 'revisionA'], 'width', value('1px', { revisionA: '2px' })))
  expect(compileCSS()).toBe('.Subject {\n&[data-a] {\nwidth: 2px;\n}\n}')
  handles.push(rule(['.Ordinary', condition('&[data-a]')], 'width', value('1px', { revisionA: '2px' })))
  expect(compileCSS()).toContain('.Ordinary {\n&[data-a] {\nwidth: 1px;\n&[data-a] {\nwidth: 2px;')
})

test('主体条件下读取 Variable，自动定义使用该条件的赋值', () => {
  const reference = variable('subject-default', { fallback: value(1, { revisionA: 2 }) })
  handles.push(rule(['.Scoped', 'revisionA'], 'opacity', reference))
  expect(compileCSS()).toContain('&[data-a] {\n--subject-default: 2;')
  expect(compileCSS()).not.toContain('--subject-default: 1;')
})

test('后续依赖提供同名函数时，也能替换已经解析过的旧定义', () => {
  const oldBody: Rules = [[undefined, 'result', '1px']]
  const newBody: Rules = [[undefined, 'result', '2px']]
  keep(rule('.Direct', 'width', cssFunction('--late-definition() returns <length>', oldBody)()))
  keep(rule('.Indirect', 'width', value('1px', { onActive: () => [
    [[condition('.Dependency')], 'width', cssFunction('--late-definition() returns <length>', newBody)()],
  ] })))
  const css = compileCSS()
  expect(css).toContain('result: 2px;')
  expect(css).not.toContain('result: 1px;')
})

test('同名变量注册按完整定义替换，不混入旧 initial-value', () => {
  const old = variable('registration-replacement', { registration: { syntax: '<length>', inherits: true, initialValue: '7px' } })
  const next = variable('registration-replacement', { registration: { syntax: '*', inherits: false } })
  keep(rule('.OldRegistration', 'width', old))
  keep(rule('.NewRegistration', 'width', next))
  const css = compileCSS()
  expect(css.match(/@property --registration-replacement/g)).toHaveLength(1)
  expect(css).toContain('syntax: "*";\ninherits: false;')
  expect(css).not.toContain('initial-value: 7px;')
})

test('缺省输入不生成损坏内容；函数与变量的递归引用都拒绝', () => {
  const empty = keep(rule('.Empty', 'color', colorMix(undefined, 'white')))
  expect(compileCSS()).toBe('')
  empty.remove()
  const recursive = variable('recursive-variable')
  recursive.fallback = recursive
  const handle = keep(rule('.Recursive', 'width', recursive))
  expect(() => compileCSS()).toThrow('循环引用')
  handle.remove()
  /** 构造循环内容，验证编译拒绝。 */
  const self = (read: (input: ValueInput) => string | undefined): string | undefined => read(self)
  keep(rule('.Recursive', 'width', self))
  expect(() => compileCSS()).toThrow('循环引用')
})

test('结构嵌套可以继承 Variable 目标，不误判为局部分支数组', () => {
  const reference = variable('nested-target')
  const body: Rules = [[undefined, undefined, 1], [['testHover'], undefined, 2]]
  keep(rule('.NestedTarget', reference, body))
  expect(compileCSS()).toBe('.NestedTarget {\n--nested-target: 1;\n&:hover {\n--nested-target: 2;\n}\n}')
})
