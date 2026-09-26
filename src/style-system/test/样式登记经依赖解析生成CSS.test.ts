/** 验证登记、按 State Condition 名称读取 Variable、依赖闭包与完整 CSS 输出。 */
import { afterEach, expect, test, vi } from 'vitest'
import { stateCondition } from '../materials/state-conditions'
import { compileCSS } from '../css-root'
import { compileRules } from '../css-root'
import { rule, rules, type Rules, type RulesHandle, type Declarations } from '../rule'
import { condition, media, type ConditionInput } from '../condition'
import { key } from '../key'
import { declare } from '../declaration'
import { createJSSContent } from '../content'
import { value, type ValueInput } from '../value'
import { variable } from '../variable'
import { variableCluster } from '../variable-cluster'
import { $margin, $marginLeft } from '../materials/keys/margin'
import { $padding } from '../materials/keys/padding'
import { $border } from '../materials/keys/border'
import { $font } from '../materials/keys/font'
import { $color } from '../materials/keys/color'
import { $transition } from '../materials/keys/transition'
import { $boxShadow } from '../materials/keys/box-shadow'
import { shadowValue } from '../materials/tools/shadow'
import { calcMultiply } from '../materials/tools/functions/calc'
import { colorMix } from '../materials/tools/functions/color-mix'
import { cssFunction } from '../materials/tools/functions/custom'
import { animationName, animationValue } from '../materials/tools/animation'
import { valueList, valueSequence } from '../materials/tools/list'
import { fontValue } from '../materials/tools/font'
import { transitionValue } from '../materials/tools/transition'
import { contentLayout } from '../materials/mixins/content'
import { boundary } from '../materials/mixins/structure'
import { clickable } from '../materials/mixins/interaction'

stateCondition('testHover', condition('&:hover'))
stateCondition('testActive', condition('&:active'))
stateCondition('testMedia', media('(width > 1px)'))
stateCondition('revisionA', condition('&[data-a]'))
stateCondition('revisionB', condition('&[data-b]'))

const runtimeRules = rules as (path: ConditionInput, declarations: unknown) => RulesHandle

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

test('Variable 在编译消费时执行 source 函数，Cluster 局部声明保留未匹配成员配方', () => {
  const toneColorDefault = variable('blue', { name: 'tone-color' })
  const toneColorLineSource = vi.fn(() => colorMix([toneColorDefault, 0.32], 'transparent'))
  const toneColor = variableCluster({
    default: toneColorDefault,
    soft: variable('lightblue', { name: 'tone-color-soft' }),
    line: variable(toneColorLineSource, { name: 'tone-color-line' }),
  })
  const accentColor = variableCluster({
    default: variable('red', { name: 'accent-color' }),
    soft: variable('pink', { name: 'accent-color-soft' }),
  })

  keep(rules('.LazyVariableButton', [[key('background'), toneColor('line')]]))
  keep(rules(['.LazyVariableButton', '&[data-tone="accent"]'], [[toneColor, accentColor]]))
  expect(toneColorLineSource).not.toHaveBeenCalled()
  const css = compileCSS()
  expect(css).toContain('background: var(--tone-color-line, color-mix(in oklab, var(--tone-color, blue) 32%, transparent));')
  expect(css).toContain('--tone-color: var(--accent-color, red);')
  expect(css).toContain('--tone-color-soft: var(--accent-color-soft, pink);')
  expect(toneColorLineSource).toHaveBeenCalledTimes(1)
})

test('Variable source 函数可以返回直接内容或 Variable，循环返回自身仍然终止编译', () => {
  const baseSize = variable('8px', { name: 'base-size' })
  const directSize = variable(() => '12px', { name: 'direct-size' })
  const linkedSize = variable(() => baseSize, { name: 'linked-size' })
  keep(rule('.LazyVariableSource', 'width', directSize))
  keep(rule('.LazyVariableSource', 'height', linkedSize))
  const css = compileCSS()
  expect(css).toContain('width: var(--direct-size, 12px);')
  expect(css).toContain('height: var(--linked-size, var(--base-size, 8px));')

  let circularColor: ReturnType<typeof variable>
  circularColor = variable(() => circularColor, { name: 'circular-color' })
  keep(rule('.CircularVariableSource', 'color', circularColor))
  expect(() => compileCSS()).toThrow('循环引用')
})

test('三项 Rule 递归继承地址，普通 Rule 的重复条件原样保留', () => {
  const child: Rules = [[[condition('&:hover')], undefined, 'blue']]
  const source: Rules = [[[condition('.example'), condition('&:hover')], 'color', child]]
  keep(rule(undefined, undefined, source))
  expect(compileCSS()).toMatch(/&:hover\s*\{\s*&:hover\s*\{\s*color:\s*blue;/)
})

test('同址声明保留顺序，删除句柄不影响其他登记', () => {
  const first = keep(rule('.example', 'color', 'red'))
  keep(rule('.example', 'display', 'grid'))
  const second = keep(rule('.example', key('color'), 'blue'))
  expect([...compileCSS().matchAll(/(?:color|display):\s*([^;]+);/g)].map(([, text]) => text))
    .toEqual(['red', 'grid', 'blue'])
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
  keep(rules('.example', [[foreground, 'red'], [$color, foreground]]))
  expect(compileCSS()).toContain('--local-foreground: red;\ncolor: var(--local-foreground, black);')
})

test('声明名称指向明确属性，不猜测未知名称', () => {
  keep(rule('.Names', 'alignItems', 'center'))
  keep(rule('.Names', 'future-property', 'native-value'))
  keep(rule('.Names', '--local-property', 'custom-value'))
  keep(rule('.SingleName', 'justifyContent', 'center'))
  const css = compileCSS()
  expect(css).toContain('align-items: center;')
  expect(css).toContain('future-property: native-value;')
  expect(css).toContain('--local-property: custom-value;')
  expect(css).toContain('justify-content: center;')
  key('test-collision-target')
  expect(() => key('testCollision-target')).toThrow('JSSKey 名称冲突：testCollisionTarget')
  expect(() => rule('.PartialName', 'testCollision-target', 'value')).toThrow('未知 JSSKey 名称：testCollision-target')
  expect(() => rule('.Unknown', 'unknownAlias', 'value')).toThrow('未知 JSSKey 名称：unknownAlias')
})

test('嵌套组合保留重复顺序、Variable 目标、内容身份与 undefined', () => {
  const local = variable('black', { name: 'ordered-local' })
  const content = vi.fn(() => '4px')
  const nested: Declarations = [
    [key('margin'), '1px'],
    [[key('margin-left'), '2px'], [key('margin'), '3px']],
    undefined,
    [[local, 'red'], [key('padding'), createJSSContent(content)], [key('color'), local]],
  ]
  keep(rules('.Ordered', nested))
  expect(content).not.toHaveBeenCalled()
  const css = compileCSS()
  expect([...css.matchAll(/(margin(?:-left)?):\s*([^;]+);/g)].map(([, key, text]) => [key, text]))
    .toEqual([['margin', '1px'], ['margin-left', '2px'], ['margin', '3px']])
  expect(css).toContain('--ordered-local: red;')
  expect(css).toContain('padding: 4px;')
  expect(css).toContain('color: var(--ordered-local, black);')
  expect(content).toHaveBeenCalled()
})

test('嵌套批量声明与单项属性不会混淆', () => {
  keep(rules('.example', [[[$color, 'red'], [$padding, '1px']]]))
  expect(compileCSS()).toContain('padding: 1px')
  expect(compileCSS()).toContain('color: red')
})

test('声明组合忽略空项和 content 为 undefined 的 Declaration，不把缺失声明登记为 Rule', () => {
  keep(rules('.example', [undefined, [$color, 'red'], [$font, undefined], [undefined, [$padding, '1px'], undefined]]))
  keep(rules('.omitted', [declare($color, undefined)]))
  const css = compileCSS()
  expect(css).toContain('color: red;')
  expect(css).toContain('padding: 1px;')
  expect(css).not.toContain('.omitted')
  expect(css).not.toContain('font:')
})

test('批量登记先验证整批，失败时既有条目与句柄保持有效', () => {
  const original = keep(rule('.example', 'color', 'red'))
  const before = compileCSS()
  const invalid = [[$color, 'blue'], [{ name: 1 }, 'grid']] as unknown as Declarations
  expect(() => keep(runtimeRules('.example', invalid))).toThrow('只接受声明序列')
  expect(compileCSS()).toBe(before)
  original.replace('green')
  expect(compileCSS()).toContain('color: green')
  const recursive: unknown[] = [[$color, 'blue']]
  recursive.push(recursive)
  expect(() => keep(runtimeRules('.example', recursive as Declarations))).toThrow('递归引用')
  expect(compileCSS()).toContain('color: green')
  const invalidProperty = [[$color, 'blue'], [{ name: 1 }, 'grid']] as unknown as Declarations
  expect(() => keep(runtimeRules('.example', invalidProperty))).toThrow()
  keep(rules('.example', [[$color, undefined]]))
  expect(() => keep(runtimeRules([null] as unknown as ConditionInput, [[$color, 'blue']]))).toThrow('Condition Path')
  expect(compileCSS()).toContain('color: green')
})

test('迭代器抛错与字符串输入整批失败，不留下已经读取的声明', () => {
  const original = keep(rule('.Atomic', 'color', 'red'))
  const before = compileCSS()
  function* broken(): IterableIterator<[string, string]> {
    yield ['color', 'blue']
    throw new Error('读取声明失败。')
  }
  expect(() => runtimeRules('.Atomic', broken())).toThrow('读取声明失败')
  expect(() => runtimeRules('.Atomic', 'color' as unknown as Declarations)).toThrow('只接受声明序列')
  expect(compileCSS()).toBe(before)
  original.replace('green')
  expect(compileCSS()).toContain('color: green;')
  expect(compileCSS()).not.toContain('color: blue;')
})

test('批量删除仅删除本批声明，重复声明不提前覆盖', () => {
  const batch = keep(rules('.example', [[$color, 'red'], [key('display'), 'grid'], [[$color, 'blue']]]))
  expect([...compileCSS().matchAll(/(?:color|display):\s*([^;]+);/g)].map(([, text]) => text))
    .toEqual(['red', 'grid', 'blue'])
  keep(rule('.example', 'color', 'green'))
  batch.remove()
  batch.remove()
  expect(compileCSS()).toContain('color: green;')
  expect(compileCSS()).not.toContain('color: red;')
  expect(compileCSS()).not.toContain('color: blue;')
})

test('普通 Rules 通过结构嵌套切换属性，不进入 Value', () => {
  const base: Rules = [[undefined, 'color', 'red'], [undefined, 'display', 'grid']]
  const matched: Rules = [[undefined, 'color', 'blue']]
  keep(rule('.example', undefined, base))
  keep(rule(['.example', '&:hover'], undefined, matched))
  const css = compileCSS()
  expect(css).toContain('color: red;')
  expect(css).toContain('display: grid;')
  expect(css).toMatch(/&:hover\s*\{\s*color:\s*blue;/)
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

test('根值、注册、函数与关键帧只随消费进入 CSS，撤销后全部退出', () => {
  const baseline = compileCSS()
  const color = variable('red', {
    name: 'resource-color',
    root: { value: 'blue' },
    registration: { syntax: '<color>', inherits: true, initialValue: 'black' },
  })
  const frames: Rules = [
    [[condition('from')], 'opacity', 0],
    [[condition('to')], 'opacity', 1],
  ]
  const motion = animationValue({ name: animationName('resource-motion', frames), duration: '1s' })
  const length = cssFunction('--resource-length() returns <length>', [[undefined, 'result', '2px']])()
  expect(compileCSS()).toBe(baseline)

  const colorHandle = keep(rule('.Resources', 'color', color))
  const motionHandle = keep(rule('.Resources', 'animation', motion))
  const lengthHandle = keep(rule('.Resources', 'width', length))
  const css = compileCSS()
  expect(css).toContain('--resource-color: blue;')
  expect(css).toContain('@property --resource-color')
  expect(css).toContain('@keyframes resource-motion')
  expect(css).toContain('@function --resource-length() returns <length>')

  colorHandle.remove()
  motionHandle.remove()
  lengthHandle.remove()
  expect(compileCSS()).toBe(baseline)
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

test('简写、详细属性和重复声明按书写顺序交给浏览器', () => {
  handles.push(rules('.Native', [
    [key('padding'), '2px 4px'],
    [key('padding-left'), '8px'],
    [key('padding'), '10px'],
    [key('future-property'), 'native-value'],
  ]))
  expect([...compileCSS().matchAll(/(padding(?:-left)?):\s*([^;]+);/g)].map(([, name, text]) => [name, text]))
    .toEqual([['padding', '2px 4px'], ['padding-left', '8px'], ['padding', '10px']])
  expect(compileCSS()).toContain('future-property: native-value;')
})

test('Mixin 处理方向配置，Key 不解释对象', () => {
  handles.push(rules('.Layout', [contentLayout({ padding: { left: '4px' } })]))
  expect(compileCSS()).toContain('padding-left: 4px;')
  expect(compileCSS()).not.toContain('display:')
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

test('独立空间配置不引入未选择的布局模式', () => {
  keep(rules('.Space', [contentLayout({ gap: '8px', padding: ['4px', '12px'] })]))
  const css = compileCSS()
  expect(css).toContain('gap: 8px;')
  expect(css).toContain('padding: 4px 12px;')
  expect(css).not.toContain('display:')
  expect(css).not.toContain('align-items:')
  expect(css).not.toContain('justify-content:')
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
  expect(compileCSS()).toContain('color: green;')
  expect(compileCSS()).not.toContain('color: blue;')
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
  const css = compileCSS()
  expect(css).toContain('--nested-target: 1;')
  expect(css).toMatch(/&:where\(:hover\)\s*\{\s*--nested-target:\s*2;/)
})
