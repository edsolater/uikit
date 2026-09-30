/** 样式登记与内容依赖解析的流程测试。
 *
 * 验证声明、Mixin、Variable 和按需资源生成完整 CSS。
 *
 * 防止定义端组合在编译与资源退出时丢失原有语义。
 */
import { afterEach, expect, test, vi } from 'vitest'
import { stateCondition } from '../pieces/state-conditions'
import { compileCSS } from '../css-root'
import { compileRules } from '../css-root'
import { rule, rules, type Rules, type RulesHandle, type Declarations } from '../rule'
import { condition, media, type ConditionInput } from '../condition'
import { key } from '../key'
import { declare } from '../declaration'
import { createJSSContent } from '../content'
import { value, type ValueInput } from '../value'
import { valueSequence } from '../pieces/contents/atom-creators/list'
import { variable } from '../variable'
import { variableCluster } from '../variable-cluster'
import { $margin, $marginLeft } from '../pieces/keys/margin'
import { $padding } from '../pieces/keys/padding'
import { $border } from '../pieces/keys/border'
import { $font } from '../pieces/keys/font'
import { $color } from '../pieces/keys/color'
import { $transition } from '../pieces/keys/transition'
import { $boxShadow } from '../pieces/keys/box-shadow'
import { shadowValue } from '../pieces/contents/atom-creators/shadow'
import { calcMultiply } from '../pieces/contents/combiners/calc'
import { colorMix } from '../pieces/contents/combiners/color-mix'
import { cssFunction } from '../pieces/contents/combiners/custom'
import { animationName, animationValue } from '../pieces/contents/atom-creators/animation'
import { fontValue } from '../pieces/contents/atom-creators/font'
import { transitionValue } from '../pieces/contents/atom-creators/transition'
import { contentLayout, innerText } from '../pieces/mixins/content'
import { boundary } from '../pieces/mixins/structure'
import { clickable } from '../pieces/mixins/interaction'
import { durationFast } from '../pieces/contents/atoms/motion'
import { lineColor } from '../pieces/contents/atoms/color/edge'

stateCondition('testHover', condition('&:hover'))
stateCondition('testActive', condition('&:active'))
stateCondition('testMedia', media('(width > 1px)'))

test('动效和分隔线按需提供普通根规则，空输入不激活', () => {
  expect(compileRules([])).toBe('')
  const motionCSS = compileRules([[[condition('.Motion')], 'transition-duration', durationFast]])
  expect(motionCSS).toContain('--motion-scale-ratio: 1;')
  expect(motionCSS).toContain('@media (prefers-reduced-motion: reduce)')
  expect(motionCSS).toContain('--motion-scale-ratio: 0;')
  expect(motionCSS).toContain('--duration-fast: calc(120ms * var(--motion-scale-ratio, 1));')
  expect(motionCSS).not.toContain('--line-color:')
  const lineCSS = compileRules([[[condition('.Line')], 'border-color', lineColor]])
  expect(lineCSS).toContain('--line-color: color-mix(')
  expect(lineCSS).not.toContain('--motion-scale-ratio:')
})

test('Variable 创建时不激活，按需规则可引用自身与稍后创建的 Variable', () => {
  const baseline = compileCSS()
  const firstActive = vi.fn((): Rules => [
    [[condition(':where(:root)')], first, 'red'],
    [[condition('.Linked')], 'color', second],
  ])
  const first = variable('black', { name: 'linked-first-color', onActive: firstActive })
  const secondActive = vi.fn((): Rules => [[[condition(':where(:root)')], second, 'blue']])
  const second = variable('navy', { name: 'linked-second-color', onActive: secondActive })
  expect(firstActive).not.toHaveBeenCalled()
  expect(secondActive).not.toHaveBeenCalled()
  expect(compileCSS()).toBe(baseline)

  const handle = keep(rule('.Linked', 'border-color', first))
  const css = compileCSS()
  expect(firstActive).toHaveBeenCalledTimes(1)
  expect(secondActive).toHaveBeenCalledTimes(1)
  expect(css).toContain('--linked-first-color: red;')
  expect(css).toContain('--linked-second-color: blue;')
  handle.remove()
  expect(compileCSS()).toBe(baseline)
})
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

test('同址声明在末项合并，删除句柄不影响其他登记', () => {
  const first = keep(rule('.example', 'color', 'red'))
  keep(rule('.example', 'display', 'grid'))
  const second = keep(rule('.example', key('color'), 'blue'))
  expect([...compileCSS().matchAll(/(?:color|display):\s*([^;]+);/g)].map(([, text]) => text))
    .toEqual(['grid', 'red, blue'])
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
    .toEqual([['margin-left', '2px'], ['margin', '1px, 3px']])
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
  expect(() => keep(runtimeRules(new Array(1) as ConditionInput, [[$color, 'blue']]))).toThrow('Condition Path')
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

test('批量删除仅删除本批声明，重复声明在末项合并', () => {
  const batch = keep(rules('.example', [[$color, 'red'], [key('display'), 'grid'], [[$color, 'blue']]]))
  expect([...compileCSS().matchAll(/(?:color|display):\s*([^;]+);/g)].map(([, text]) => text))
    .toEqual(['grid', 'red, blue'])
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
    registration: { syntax: '<color>', inherits: true, initialValue: 'black' },
    onActive: (): Rules => [[[condition(':where(:root)')], color, 'blue']],
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

test('简写与详细属性保持相对顺序，同名声明在末项合并', () => {
  handles.push(rules('.Native', [
    [key('padding'), '2px 4px'],
    [key('padding-left'), '8px'],
    [key('padding'), '10px'],
    [key('future-property'), 'native-value'],
  ]))
  expect([...compileCSS().matchAll(/(padding(?:-left)?):\s*([^;]+);/g)].map(([, name, text]) => [name, text]))
    .toEqual([['padding-left', '8px'], ['padding', '2px 4px, 10px']])
  expect(compileCSS()).toContain('future-property: native-value;')
})

test('Mixin 处理方向配置，Key 不解释对象', () => {
  handles.push(rules('.Layout', [contentLayout({ padding: { left: '4px' } })]))
  expect(compileCSS()).toContain('padding-left: 4px;')
  expect(compileCSS()).not.toContain('display:')
})

test('内容 Mixin 先识别完整内容，再识别方向和字体配置', () => {
  const activate = vi.fn((): Rules => [[[condition(':root')], '--padding-resource', '4px']])
  const compileFont = vi.fn(() => 'italic 18px system-ui')
  keep(rules('.ResourcePadding', [contentLayout({ padding: { onActive: activate } })]))
  keep(rules('.ContentFont', [innerText({ font: { family: 'metadata', onCompile: compileFont } })]))
  keep(rules('.PlainConfig', [
    contentLayout({ padding: { top: '2px', left: '4px' } }),
    innerText({ font: { size: '16px', family: 'serif' } }),
  ]))
  const css = compileCSS()
  expect(activate).toHaveBeenCalledTimes(1)
  expect(css).toContain('--padding-resource: 4px;')
  expect(css).not.toContain('.ResourcePadding')
  expect(compileFont).toHaveBeenCalledTimes(1)
  expect(css).toContain('.ContentFont {\nfont: italic 18px system-ui;')
  expect(css).toContain('padding-top: 2px;')
  expect(css).toContain('padding-left: 4px;')
  expect(css).toContain('font: 16px serif;')
})

test('编译 root 的规则容器改写不污染登记账本或直接输入', () => {
  const target = keep(rule('.SnapshotTarget', 'color', 'red'))
  const trigger = keep(rule('.SnapshotTrigger', undefined, {
    onActive: ({ root }) => { root.find((entry) => entry[0]?.some((item) => typeof item !== 'string' && item.header === '.SnapshotTarget'))![2] = 'blue' },
  }))
  expect(compileCSS()).toContain('color: red;')
  trigger.remove()
  expect(compileCSS()).toContain('color: red;')
  target.remove()

  const shared = variable('green', { name: 'snapshot-shared-color' })
  const childPath = [condition('& .Child')]
  const nested: Rules = [[childPath, 'color', shared]]
  const sourcePath = [condition('.SnapshotInput')]
  const source: Rules = [[sourcePath, undefined, nested]]
  source.push([[condition('.MutateSnapshot')], undefined, {
    onActive: ({ root }) => {
      expect(root[0][2]).not.toBe(nested)
      const snapshot = root[0][2] as Rules
      expect(snapshot[0][2]).toBe(shared)
      root[0][0]!.push(condition('.Extra'))
      snapshot[0][0]!.push(condition('.NestedExtra'))
      snapshot[0][2] = 'blue'
    },
  }])
  const css = compileRules(source)
  expect(css).toContain('var(--snapshot-shared-color, green)')
  expect(sourcePath).toHaveLength(1)
  expect(childPath).toHaveLength(1)
  expect(nested[0][2]).toBe(shared)
  source.pop()
  expect(compileRules(source)).toContain('var(--snapshot-shared-color, green)')
  const circular: Rules = []
  circular.push([undefined, undefined, circular])
  expect(() => compileRules(circular)).toThrow('递归引用')
  for (const invalid of [[1], [[]]]) {
    expect(() => compileRules([[undefined, undefined, invalid as unknown as Rules]])).toThrow('嵌套 Rules 必须由路径、Key、内容三项组成')
  }
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
  expect(compileCSS()).toContain('color: green, blue;')
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

test('完整 Creator 配置经句柄替换后编译新依赖，旧注册与资源退出', () => {
  const old = variable('red', { name: 'creator-old-color', registration: { syntax: '<color>', inherits: false, initialValue: 'red' } })
  const next = variable('blue', { name: 'creator-new-color', registration: { syntax: '<color>', inherits: false, initialValue: 'blue' } })
  const handle = keep(rule('.CompleteCreator', $boxShadow, shadowValue({ x: '1px', y: '2px', color: old })))
  const first = compileCSS()
  expect(first).toContain('box-shadow: 1px 2px var(--creator-old-color, red);')
  expect(first).toContain('@property --creator-old-color {')
  handle.replace(shadowValue({ x: '3px', y: '4px', color: next }))
  const second = compileCSS()
  expect(second).toContain('box-shadow: 3px 4px var(--creator-new-color, blue);')
  expect(second).toContain('@property --creator-new-color {')
  expect(second).not.toContain('--creator-old-color')
  let calls = 0
  const child = {
    onActive: (): Rules => [[[condition('.CreatorNewDependency')], 'width', '7px']],
    onCompile: () => { calls++; return '9px' },
  }
  handle.replace(shadowValue({ x: child, y: '4px', color: 'black' }))
  const third = compileCSS()
  expect(third).toContain('box-shadow: 9px 4px black;')
  expect(third).toContain('.CreatorNewDependency {\nwidth: 7px;\n}')
  expect(third).not.toContain('--creator-old-color')
  expect(third).not.toContain('--creator-new-color')
  expect(calls).toBe(1)
  handle.remove()
  const removed = compileCSS()
  expect(removed).not.toContain('.CompleteCreator')
  expect(removed).not.toContain('.CreatorNewDependency')
})

test('结构嵌套可以继承 Variable 目标，不误判为局部分支数组', () => {
  const nestedTargetVariable = variable(undefined, { name: 'nested-target' })
  const body: Rules = [[undefined, undefined, 1], [['testHover'], undefined, 2]]
  keep(rule('.NestedTarget', nestedTargetVariable, body))
  const css = compileCSS()
  expect(css).toContain('--nested-target: 1;')
  expect(css).toMatch(/&:where\(:hover\)\s*\{\s*--nested-target:\s*2;/)
})
