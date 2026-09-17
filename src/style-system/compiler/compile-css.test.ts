/** 验证登记、按 Condition 读取 Value、依赖闭包与完整 CSS 输出。 */
import { afterEach, expect, test, vi } from 'vitest'
import { compileCSS } from '../core/css-root'
import { rule, rules, type Rules, type RuleAddress, type RuleValue, type RulesHandle, type Declarations } from '../core/css-rule'
import { condition, media, type ConditionInput } from '../core/css-condition'
import { key } from '../core/css-key'
import { declare } from '../core/css-declaration'
import { value } from '../core/css-value'
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
import { cssFunction } from '../values/functions/custom'
import { animationName, animationValue } from '../values/animation'

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

test('四种二项地址递归继承，普通 Rule 的重复条件原样保留', () => {
  const child: Rules = new Map([[[[condition('&:hover')], undefined], 'blue']])
  const source: Rules = new Map([[[[condition('.example'), condition('&:hover')], 'color'], child]])
  keep(rule(undefined, undefined, source))
  expect(compileCSS()).toBe('.example {\n&:hover {\n&:hover {\ncolor: blue;\n}\n}\n}')
})

test('rule 无需上下文，同址更新保持位置，旧句柄不控制新写入', () => {
  const first = keep(rule('.example', 'color', 'red'))
  keep(rule('.example', 'display', 'grid'))
  const second = keep(rule('.example', key('color'), 'blue'))
  expect(compileCSS()).toBe('.example {\ncolor: blue;\ndisplay: grid;\n}')
  first.remove()
  expect(() => first.replace('black')).toThrow('后续写入')
  second.replace('green')
  expect(compileCSS()).toContain('color: green')
  second.remove()
  expect(compileCSS()).not.toContain('color:')
  expect(() => second.replace('purple')).toThrow()
})

test('同一对象被后写覆盖后，旧句柄不能删除新登记', () => {
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

test('不同 Condition 对象的相同 header 共享 Rule、Value 与 Variable 地址', () => {
  const firstHover = condition('&:hover')
  const sameHover = condition('&:hover')
  keep(rule(['.same-rule', firstHover], 'color', 'red'))
  keep(rule(['.same-rule', sameHover], 'color', 'blue'))
  const nested = value('black', [[firstHover, 'navy']])
  keep(rule('.same-value', 'color', value('red', [[sameHover, nested]])))
  const foreground = variable('color-condition-identity', {
    fallback: value('black', [[firstHover, 'gray']]),
  })
  keep(rules('.same-variable', [[foreground, [[sameHover, 'silver']]], [$color, foreground]]))

  const css = compileCSS()
  expect(css).toContain('.same-rule {\n&:hover {\ncolor: blue;\n}\n}')
  expect(css).not.toContain('.same-rule {\n&:hover {\ncolor: red;')
  expect(css).toContain('.same-value {\ncolor: red;\n&:hover {\ncolor: navy;')
  expect(css).toContain('.same-variable {\n&:hover {\n--color-condition-identity: silver;')
  expect(css).toContain('color: var(--color-condition-identity, black);')
})

test('声明二元数组只配对 Key 与 content，Variable 可同时作为声明 Key 和引用 Value', () => {
  const foreground = variable('local-foreground', { fallback: 'black' })
  expect(declare(foreground, 'red')).toEqual([foreground, 'red'])
  expect(declare($color, foreground)).toEqual([$color, foreground])
  keep(rules('.example', [[foreground, 'red'], [$color, foreground]]))
  expect(compileCSS()).toContain('--local-foreground: red;\ncolor: var(--local-foreground, black);')
})

test('嵌套批量声明与单项属性不会混淆', () => {
  keep(rules('.example', [[[$color, 'red'], [$padding, ['1px']]]]))
  expect(compileCSS()).toContain('padding-left: 1px')
  expect(compileCSS()).toContain('color: red')
})

test('声明组合忽略空项和 content 为 undefined 的 Declaration，不把缺失声明登记为 Rule', () => {
  expect(declare($color, undefined)).toEqual([$color, undefined])
  keep(rules('.example', [undefined, [$color, 'red'], [$font, undefined], [undefined, [$padding, ['1px']], undefined]]))
  keep(rule('.omitted', undefined, declare($color, undefined)))
  expect(compileCSS()).toBe('.example {\ncolor: red;\npadding-top: 1px;\npadding-right: 1px;\npadding-bottom: 1px;\npadding-left: 1px;\n}')
})

test('批量登记先验证整批，失败时既有条目与句柄保持有效', () => {
  const original = keep(rule('.example', 'color', 'red'))
  const invalid = [[$color, 'blue'], [{ name: 1 }, 'grid']] as unknown as Declarations
  expect(() => keep(rules('.example', invalid))).toThrow('只接受声明二元数组')
  expect(compileCSS()).toBe('.example {\ncolor: red;\n}')
  original.replace('green')
  expect(compileCSS()).toContain('color: green')
  const recursive: Declarations = [[$color, 'blue']]
  recursive.push(recursive)
  expect(() => keep(rules('.example', recursive))).toThrow('递归引用')
  expect(compileCSS()).toContain('color: green')
  const invalidProperty = [[$color, 'blue'], [{ name: 1 }, 'grid']] as unknown as Declarations
  expect(() => keep(rules('.example', invalidProperty))).toThrow()
  keep(rules('.example', [[$color, undefined]]))
  expect(() => keep(rules([null] as unknown as ConditionInput, [[$color, 'blue']]))).toThrow('Condition Path')
  expect(compileCSS()).toContain('color: green')
})

test('批量删除只删除本批仍然拥有的地址，重复地址保持首次位置', () => {
  const batch = keep(rules('.example', [[$color, 'red'], [key('display'), 'grid'], [[$color, 'blue']]]))
  expect(compileCSS()).toBe('.example {\ncolor: blue;\ndisplay: grid;\n}')
  keep(rule('.example', 'color', 'green'))
  batch.remove()
  batch.remove()
  expect(compileCSS()).toBe('.example {\ncolor: green;\n}')
})

test('定义只保存结构；外层 default 与条件分支约束子 Value', () => {
  const active = vi.fn()
  const red = value('red', [['&:hover', 'lightcoral'], ['&:active', 'darkred']], { onActive: active })
  const blue = value('blue', [['&:hover', value(value('cyan'))]])
  const foreground = value(value(red), [['&:hover', blue]])
  expect(foreground.default).toHaveProperty('default', red)
  expect(active).not.toHaveBeenCalled()
  keep(rule('.example', 'color', foreground))
  const css = compileCSS()
  expect(css).toBe('.example {\ncolor: red;\n&:hover {\ncolor: cyan;\n}\n}')
  expect(active).toHaveBeenCalledTimes(1)
})

test('同一个 Value 的 hover 与 active 各读自身属性，共享 DAG 不误报循环', () => {
  const red = value('red', [['&:hover', 'lightcoral'], ['&:active', 'darkred']])
  keep(rule('.example', 'color', value('black', [['&:hover', red], ['&:active', red]])))
  keep(rule('.example', 'border-color', red))
  const css = compileCSS()
  expect(css).toContain('color: lightcoral')
  expect(css).toContain('color: darkred')
  expect(css).toContain('border-color: darkred')
})

test('Value 支持业务选择器和媒体 Condition，不同分支不自动合成地址', () => {
  const compact = condition('&[data-density="compact"]')
  const wide = media('(width > 800px)')
  const compactSize = value('8px', [[compact, '6px']])
  const size = value('12px', [[compact, compactSize], [wide, '16px']])
  expect(size.conditions.map(([path]) => path)).toEqual([[compact], [wide]])
  keep(rule('.example', 'gap', size))
  keep(rule('.example', 'width', calcMultiply(value('2px', [[compact, '3px']]), value(2, [[wide, 4]]))))
  const css = compileCSS()
  expect(css).toContain('&[data-density="compact"] {\ngap: 6px;')
  expect(css).toContain('@media (width > 800px) {\ngap: 16px;')
  expect(css).toContain('width: calc(2px * 2);')
  expect(css.match(/width:/g)).toHaveLength(1)
})

test('当前链再次访问实际槽位时抛错；fallback 循环也能终止', () => {
  const a = value('red')
  const b = value(a)
  a.conditions.push([[condition('&:hover')], b])
  keep(rule('.example', 'color', a))
  expect(() => compileCSS()).toThrow('循环引用')
  for (const handle of handles.splice(0)) handle.remove()
  const recursive = value('red')
  recursive.default = recursive
  keep(rule('.example', 'color', recursive))
  expect(() => compileCSS()).toThrow('循环引用')
})

test('外层状态只选择同键，不展开所选颜色无关的 active', () => {
  const blue = value('blue', [['&:hover', 'cyan'], ['&:active', 'navy']])
  keep(rule('.example', 'color', value('red', [['&:hover', blue]])))
  expect(compileCSS()).toBe('.example {\ncolor: red;\n&:hover {\ncolor: cyan;\n}\n}')
  blue.conditions.push([[condition('&:active')], blue])
  expect(compileCSS()).not.toContain('&:active')
})

test('完整 Rules 仍可作为递归内容切换属性', () => {
  const base: Rules = new Map([[[undefined, 'color'], 'red'], [[undefined, 'display'], 'grid']])
  const matched: Rules = new Map([[[undefined, 'color'], 'blue']])
  keep(rule('.example', undefined, value(base, [['&:hover', matched]])))
  expect(compileCSS()).toBe('.example {\ncolor: red;\ndisplay: grid;\n&:hover {\ncolor: blue;\n}\n}')
})

test('复合值只保留相容分支，重复状态键后写生效', () => {
  keep(rule('.example', 'width', calcMultiply(value('2px', [['&:hover', '4px']]), value(2, [['&:active', 3]]))))
  expect(compileCSS()).toBe('.example {\nwidth: calc(2px * 2);\n}')
  keep(rule('.same', 'width', calcMultiply(value(2, [['&:hover', 3], ['&:hover', 4]]), value(2, [['&:hover', 5]]))))
  expect(compileCSS()).toContain('width: calc(4 * 5)')
})

test('完整条件地址与子 Value 分支不符时拒绝该分支', () => {
  const amount = value(2, [['&:hover', 4]])
  keep(rule('.example', 'width', value('1px', [[[condition('&:hover'), condition('&:active')], calcMultiply(amount, 3)]])))
  expect(compileCSS()).toBe('.example {\nwidth: 1px;\n}')
})

test('依赖只进入本次编译，删掉源条目后派生资源退出', () => {
  const nestedActive = vi.fn((): Rules => new Map([[[[condition(':root')], '--value-factor'], 3]]))
  const nested = value('3px', { onActive: nestedActive })
  const active = vi.fn((): Rules => new Map([[[[condition(':root')], '--size-example'], nested]]))
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
  const distance = value('2px', [['&:hover', value('4px', { onActive: active })]])
  keep(rule('.example', 'width', calcMultiply(distance, 2)))
  compileCSS()
  expect(active).toHaveBeenCalledWith(expect.objectContaining({ path: [condition('.example'), condition('&:hover')], key: 'width' }))
})

test('依赖回指同一集合终止，Rules 内容递归报错', () => {
  const dependency: Rules = new Map()
  dependency.set([[condition('.example')], 'color'], value('red', { onActive: () => dependency }))
  const handle = keep(rule(undefined, undefined, dependency))
  expect(compileCSS()).toContain('color: red')
  handle.remove()
  const recursive: Rules = new Map()
  recursive.set([undefined, undefined], recursive)
  keep(rule(undefined, undefined, recursive))
  expect(() => compileCSS()).toThrow('递归引用')
})

test('Variable 条件默认值与局部声明共享同名 Custom Property，显式声明优先', () => {
  const hover = condition('&:hover')
  const active = condition('&:active')
  const missing = condition('&:missing')
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

test('单值直接声明，多个有序内容用数组，简写与复合字段在编译时展开', () => {
  keep(rules('.example', [
    [$margin, '4px'],
    [$marginLeft, '8px'],
    [$padding, ['1px', '2px', '3px']],
    [$border, ['red', '4px', 'solid']],
    [$font, { style: 'italic', size: '16px', lineHeight: 1.5, family: 'system-ui' }],
  ]))
  keep(rules('.single', [[$padding, '4px'], [$border, 'none']]))
  const css = compileCSS()
  expect(css).toContain('margin-left: 8px')
  expect(css).not.toContain('margin-left: 4px')
  expect(css).toContain('padding-bottom: 3px')
  expect(css).toContain('font: italic 16px/1.5 system-ui')
  expect(css).toContain('.single {\npadding-top: 4px')
  expect(css).toContain('border: none')
})

test('阴影与过渡数组内容保留状态和完整语法', () => {
  const shadow = declare($boxShadow, [
    shadowValue({ x: 0, y: value('2px', [['&:hover', '4px']]), color: 'black' }),
    shadowValue({ x: 0, y: 0, spread: '1px', color: 'red' }),
  ])
  const timing = declare($transition, [
    [key('opacity'), '100ms', 'ease'],
    [key('transform'), '200ms', 'linear', '30ms'],
  ])
  keep(rules('.example', [shadow, timing]))
  expect(compileCSS()).toContain('box-shadow: 0 4px black, 0 0 0 1px red')
  expect(compileCSS()).toContain('transition: opacity 100ms ease, transform 200ms linear 30ms')
})

test('动画和函数激活完整资源，同名函数替换整个定义', () => {
  const opacity = variable('--fade-opacity', { root: { value: 1 } })
  const frames: Rules = new Map<RuleAddress, RuleValue>([[[[condition('from')], 'opacity'], 0], [[[condition('to')], 'opacity'], opacity]])
  keep(rule('.example', 'animation', animationValue({ name: animationName('motion-fade', frames), duration: '1s' })))
  const oldBody: Rules = new Map<RuleAddress, RuleValue>([[[undefined, '--old-local'], '100px'], [[undefined, 'result'], value('16px', [[media('(width > 1px)'), '20px']])]])
  const nextBody: Rules = new Map([[[undefined, 'result'], '24px']])
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
  const ratio = variable('old-function-ratio', { fallback: value(0.8, [[media('(width > 1px)'), 0.6]]) })
  const oldBody: Rules = new Map([[[undefined, 'result'], ratio]])
  const nextBody: Rules = new Map([[[undefined, 'result'], 1]])
  keep(rule('.old-function', 'opacity', cssFunction('--example-ratio() returns <number>', oldBody)()))
  keep(rule('.new-function', 'opacity', cssFunction('--example-ratio() returns <number>', nextBody)()))

  const css = compileCSS()
  expect(css.match(/@function --example-ratio/g)).toHaveLength(1)
  expect(css).not.toContain('--old-function-ratio')
  expect(css).toContain('result: 1;')
})
