/** 验证登记、按 State Condition 名称读取 Variable、依赖闭包与完整 CSS 输出。 */
import { afterEach, expect, test, vi } from 'vitest'
import { stateCondition } from '../state-conditions'
import { compileCSS } from '../core/css-root'
import { rule, rules, type Rules, type RuleValue, type RulesHandle, type DeclarationGroup, type Declarations } from '../core/css-rule'
import { condition, media, type ConditionInput } from '../core/css-condition'
import { key } from '../core/css-key'
import { declare } from '../core/css-declaration'
import { value, cssContent, type ValueInput } from '../core/css-value'
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

stateCondition('testHover', condition('&:hover'))
stateCondition('testActive', condition('&:active'))
stateCondition('testMedia', media('(width > 1px)'))
stateCondition('revisionA', condition('&[data-a]'))
stateCondition('revisionB', condition('&[data-b]'))

const legacyRules = rules as (path: ConditionInput, declarations: unknown) => RulesHandle

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

test('声明二元数组只配对 Key 与 content，Variable 可同时作为声明 Key 和引用 Value', () => {
  const foreground = variable('black', { name: 'local-foreground' })
  expect(declare(foreground, 'red')).toEqual([foreground, 'red'])
  expect(declare($color, foreground)).toEqual([$color, foreground])
  keep(legacyRules('.example', [[foreground, 'red'], [$color, foreground]]))
  expect(compileCSS()).toContain('--local-foreground: red;\ncolor: var(--local-foreground, black);')
})

test('对象、数组、Map、Set 与一次性 Iterable 进入同一有序声明路径', () => {
  const tuples: [string, string][] = [
    ['display', 'inline-flex'],
    ['alignItems', 'center'],
    ['justifyContent', 'center'],
  ]
  let iteratorCalls = 0
  const once: Iterable<[string, string]> = {
    *[Symbol.iterator]() {
      iteratorCalls += 1
      if (iteratorCalls > 1) throw new Error('声明 Iterable 被重复读取。')
      yield* tuples
    },
  }
  const inputs: unknown[] = [
    { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
    tuples,
    new Map(tuples),
    new Set(tuples),
    once,
  ]
  const outputs = inputs.map((input) => {
    const handle = legacyRules('.Inputs', input)
    const output = compileCSS()
    handle.remove()
    return output
  })
  expect(new Set(outputs)).toHaveLength(1)
  expect(outputs[0]).toBe('.Inputs {\ndisplay: inline-flex;\nalign-items: center;\njustify-content: center;\n}')
  expect(iteratorCalls).toBe(1)
})

test('声明名称统一解析已登记别名，同时保留原生与自定义属性字符串', () => {
  keep(legacyRules('.Names', {
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
  expect(() => legacyRules('.Unknown', { unknownAlias: 'value' })).toThrow('未知 CSS Key 名称：unknownAlias')
})

test('嵌套组合保留重复顺序、Variable 目标、内容身份与 undefined', () => {
  const local = variable('black', { name: 'ordered-local' })
  const content = vi.fn(() => '4px')
  const nested: unknown[] = [
    { margin: '1px' },
    new Set<[string, RuleValue]>([['margin-left', '2px'], ['margin', '3px']]),
    undefined,
    [[local, 'red'], ['padding', cssContent(content)], ['color', local]],
  ]
  keep(legacyRules('.Ordered', nested))
  expect(content).not.toHaveBeenCalled()
  expect(compileCSS()).toBe('.Ordered {\nmargin: 1px;\nmargin-left: 2px;\nmargin: 3px;\n--ordered-local: red;\npadding: 4px;\ncolor: var(--ordered-local, black);\n}')
  expect(content).toHaveBeenCalled()
})

test('嵌套批量声明与单项属性不会混淆', () => {
  keep(legacyRules('.example', [[[$color, 'red'], [$padding, '1px']]]))
  expect(compileCSS()).toContain('padding: 1px')
  expect(compileCSS()).toContain('color: red')
})

test('声明组合忽略空项和 content 为 undefined 的 Declaration，不把缺失声明登记为 Rule', () => {
  expect(declare($color, undefined)).toEqual([$color, undefined])
  keep(legacyRules('.example', [undefined, [$color, 'red'], [$font, undefined], [undefined, [$padding, '1px'], undefined]]))
  keep(legacyRules('.omitted', [declare($color, undefined)]))
  expect(compileCSS()).toBe('.example {\ncolor: red;\npadding: 1px;\n}')
})

test('批量登记先验证整批，失败时既有条目与句柄保持有效', () => {
  const original = keep(rule('.example', 'color', 'red'))
  const invalid = [[$color, 'blue'], [{ name: 1 }, 'grid']] as unknown as Declarations
  expect(() => keep(legacyRules('.example', invalid))).toThrow('只接受声明序列')
  expect(compileCSS()).toBe('.example {\ncolor: red;\n}')
  original.replace('green')
  expect(compileCSS()).toContain('color: green')
  const recursive: unknown[] = [[$color, 'blue']]
  recursive.push(recursive)
  expect(() => keep(legacyRules('.example', recursive as Declarations))).toThrow('递归引用')
  expect(compileCSS()).toContain('color: green')
  const invalidProperty = [[$color, 'blue'], [{ name: 1 }, 'grid']] as unknown as Declarations
  expect(() => keep(legacyRules('.example', invalidProperty))).toThrow()
  keep(legacyRules('.example', [[$color, undefined]]))
  expect(() => keep(legacyRules([null] as unknown as ConditionInput, [[$color, 'blue']]))).toThrow('Condition Path')
  expect(compileCSS()).toContain('color: green')
})

test('迭代器抛错与字符串输入整批失败，不留下已经读取的声明', () => {
  const original = keep(rule('.Atomic', 'color', 'red'))
  function* broken(): IterableIterator<[string, string]> {
    yield ['color', 'blue']
    throw new Error('读取声明失败。')
  }
  expect(() => legacyRules('.Atomic', broken())).toThrow('读取声明失败')
  expect(() => legacyRules('.Atomic', 'color' as unknown as Declarations)).toThrow('只接受声明序列')
  expect(compileCSS()).toBe('.Atomic {\ncolor: red;\n}')
  original.replace('green')
  expect(compileCSS()).toBe('.Atomic {\ncolor: green;\n}')
})

test('批量删除仅删除本批声明，重复声明不提前覆盖', () => {
  const batch = keep(legacyRules('.example', [[$color, 'red'], [key('display'), 'grid'], [[$color, 'blue']]]))
  expect(compileCSS()).toBe('.example {\ncolor: red;\ndisplay: grid;\ncolor: blue;\n}')
  keep(rule('.example', 'color', 'green'))
  batch.remove()
  batch.remove()
  expect(compileCSS()).toBe('.example {\ncolor: green;\n}')
})

test('普通 Rules 通过结构嵌套切换属性，不进入 Value', () => {
  const base: Rules = [[undefined, 'color', 'red'], [undefined, 'display', 'grid']]
  const matched: Rules = [[undefined, 'color', 'blue']]
  keep(rule('.example', undefined, base))
  keep(rule(['.example', '&:hover'], undefined, matched))
  expect(compileCSS()).toBe('.example {\ncolor: red;\ndisplay: grid;\n&:hover {\ncolor: blue;\n}\n}')
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

test('原生简写原样保留，复合字段由内容函数编译', () => {
  keep(legacyRules('.example', [
    [$margin, '4px'],
    [$marginLeft, '8px'],
    [$padding, valueSequence('1px', '2px', '3px')],
    [$border, valueSequence('red', '4px', 'solid')],
    [$font, fontValue({ style: 'italic', size: '16px', lineHeight: 1.5, family: 'system-ui' })],
  ]))
  keep(legacyRules('.single', [[$padding, '4px'], [$border, 'none']]))
  const css = compileCSS()
  expect(css).toContain('margin-left: 8px')
  expect(css).toContain('margin: 4px')
  expect(css).toContain('padding: 1px 2px 3px')
  expect(css).toContain('font: italic 16px/1.5 system-ui')
  expect(css).toContain('.single {\npadding: 4px')
  expect(css).toContain('border: none')
})

test('Key 只有名称；简写、详细属性和重复声明按书写顺序输出', () => {
  expect(key('padding')).toEqual({ name: 'padding' })
  handles.push(legacyRules('.Native', [
    [key('padding'), '2px 4px'],
    ['padding-left', '8px'],
    ['padding', '10px'],
    ['future-property', 'native-value'],
  ]))
  expect(compileCSS()).toBe('.Native {\npadding: 2px 4px;\npadding-left: 8px;\npadding: 10px;\nfuture-property: native-value;\n}')
})

test('Mixin 处理方向配置，Key 不解释对象', () => {
  handles.push(legacyRules('.Layout', [contentLayout({ padding: { left: '4px' } })]))
  expect(compileCSS()).toBe('.Layout {\npadding-left: 4px;\n}')
})

test('边界形状按需输出，省略时保留边框和焦点配置', () => {
  keep(legacyRules('.Shape', [boundary({ radius: '999px', cornerShape: 'squircle' })]))
  keep(legacyRules('.Boundary', [boundary({ border: ['1px', 'solid', 'transparent'], outline: { width: '2px', style: 'solid', color: 'blue', offset: '2px' } })]))
  keep(legacyRules('.EmptyBoundary', [boundary()]))
  const css = compileCSS()
  expect(css).toContain('.Shape {\nborder-radius: 999px;\ncorner-shape: squircle;')
  expect(css).toContain('.Boundary {\nborder: 1px solid transparent;\noutline-width: 2px;\noutline-style: solid;\noutline-color: blue;\noutline-offset: 2px;')
  expect(css.match(/corner-shape:/g)).toHaveLength(1)
  expect(css).not.toContain('.EmptyBoundary')
})

test('center 由 Mixin 选择实现，独立空间配置不要求布局模式', () => {
  keep(legacyRules('.Center', [contentLayout({ mode: 'center' })]))
  keep(legacyRules('.Space', [contentLayout({ gap: '8px', padding: ['4px', '12px'] })]))
  expect(compileCSS()).toBe('.Center {\ndisplay: inline-flex;\nalign-items: center;\njustify-content: center;\n}\n.Space {\ngap: 8px;\npadding: 4px 12px;\n}')
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

test('后续依赖提供同名函数时，也能替换已经解析过的旧定义', () => {
  const oldBody: Rules = [[undefined, 'result', '1px']]
  const newBody: Rules = [[undefined, 'result', '2px']]
  keep(rule('.Direct', 'width', cssFunction('--late-definition() returns <length>', oldBody)()))
  keep(rule('.Indirect', 'width', value('1px', {
    onActive: () => [
      [[condition('.Dependency')], 'width', cssFunction('--late-definition() returns <length>', newBody)()],
    ]
  })))
  const css = compileCSS()
  expect(css).toContain('result: 2px;')
  expect(css).not.toContain('result: 1px;')
})

test('同名变量注册按完整定义替换，不混入旧 initial-value', () => {
  const old = variable(undefined, { name: 'registration-replacement', registration: { syntax: '<length>', inherits: true, initialValue: '7px' } })
  const next = variable(undefined, { name: 'registration-replacement', registration: { syntax: '*', inherits: false } })
  keep(rule('.OldRegistration', 'width', old))
  keep(rule('.NewRegistration', 'width', next))
  const css = compileCSS()
  expect(css.match(/@property --registration-replacement/g)).toHaveLength(1)
  expect(css).toContain('syntax: "*";\ninherits: false;')
  expect(css).not.toContain('initial-value: 7px;')
})

test('结构嵌套可以继承 Variable 目标，不误判为局部分支数组', () => {
  const reference = variable(undefined, { name: 'nested-target' })
  const body: Rules = [[undefined, undefined, 1], [['testHover'], undefined, 2]]
  keep(rule('.NestedTarget', reference, body))
  expect(compileCSS()).toBe('.NestedTarget {\n--nested-target: 1;\n&:hover {\n--nested-target: 2;\n}\n}')
})
