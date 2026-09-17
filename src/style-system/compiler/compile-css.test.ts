/** 验证登记、按 Condition 读取 Value、依赖闭包与完整 CSS 输出。 */
import { afterEach, expect, test, vi } from 'vitest'
import { compileCSS } from '../core/css-root'
import { rule, rules, type Rules, type RuleAddress, type RuleValue, type RulesHandle, type RuleDeclarations } from '../core/css-rule'
import { condition, media, type ConditionInput } from '../core/css-condition'
import { key } from '../core/css-key'
import { value } from '../core/css-value'
import { declareVariable, variable } from '../core/css-variable'
import { margin, marginLeft } from '../declarations/margin'
import { padding } from '../declarations/padding'
import { border } from '../declarations/border'
import { font } from '../declarations/font'
import { color } from '../declarations/color'
import { transition } from '../declarations/transition'
import { boxShadow } from '../declarations/box-shadow'
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

test('Condition name 保持同一地址，header 可用新 CSS 表达覆盖', () => {
  keep(rule(['.example', condition('&:hover', 'hover')], 'color', 'red'))
  keep(rule(['.example', condition('&:where(:hover)', 'hover')], 'color', 'blue'))
  expect(compileCSS()).toBe('.example {\n&:where(:hover) {\ncolor: blue;\n}\n}')
})

test('嵌套批量声明与单项属性不会混淆', () => {
  keep(rules('.example', [[color('red'), padding('1px')]]))
  expect(compileCSS()).toContain('padding-left: 1px')
  expect(compileCSS()).toContain('color: red')
})

test('批量登记先验证整批，失败时既有条目与句柄保持有效', () => {
  const original = keep(rule('.example', 'color', 'red'))
  const invalid = [color('blue'), ['display', undefined]] as unknown as RuleDeclarations
  expect(() => keep(rules('.example', invalid))).toThrow('属性条目')
  expect(compileCSS()).toBe('.example {\ncolor: red;\n}')
  original.replace('green')
  expect(compileCSS()).toContain('color: green')
  const recursive: RuleDeclarations = [color('blue')]
  recursive.push(recursive)
  expect(() => keep(rules('.example', recursive))).toThrow('递归引用')
  expect(compileCSS()).toContain('color: green')
  const invalidProperty = [color('blue'), [{ name: 1 }, 'grid']] as unknown as RuleDeclarations
  expect(() => keep(rules('.example', invalidProperty))).toThrow()
  expect(() => keep(rules([null] as unknown as ConditionInput, [color('blue'), ['display', 'grid']]))).toThrow('Condition Path')
  expect(compileCSS()).toContain('color: green')
})

test('批量删除只删除本批仍然拥有的地址，重复地址保持首次位置', () => {
  const batch = keep(rules('.example', [color('red'), ['display', 'grid'], [color('blue')]]))
  expect(compileCSS()).toBe('.example {\ncolor: blue;\ndisplay: grid;\n}')
  keep(rule('.example', 'color', 'green'))
  batch.remove()
  batch.remove()
  expect(compileCSS()).toBe('.example {\ncolor: green;\n}')
})

test('定义只保存结构；编译按同键读取子 Value，缺失键穿过 default', () => {
  const active = vi.fn()
  const red = value('red', [['&:hover', 'lightcoral'], ['&:active', 'darkred']], { onActive: active })
  const blue = value('blue', [['&:hover', value(value('cyan'))]])
  const foreground = value(value(red), [['&:hover', blue]])
  expect(foreground.default).toHaveProperty('default', red)
  expect(active).not.toHaveBeenCalled()
  keep(rule('.example', 'color', foreground))
  const css = compileCSS()
  expect(css).toBe('.example {\ncolor: red;\n&:hover {\ncolor: cyan;\n}\n&:active {\ncolor: darkred;\n}\n}')
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

test('Value 支持业务选择器和媒体 Condition，同路径递归与交集不依赖 State 分类', () => {
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
  expect(css).toContain('&[data-density="compact"] {\n@media (width > 800px) {\nwidth: calc(3px * 4);')
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

test('复合值保持各子值的状态与交集，重复状态键后写生效', () => {
  keep(rule('.example', 'width', calcMultiply(value('2px', [['&:hover', '4px']]), value(2, [['&:active', 3]]))))
  expect(compileCSS()).toContain('&:hover {\n&:active {\nwidth: calc(4px * 3)')
  keep(rule('.same', 'width', calcMultiply(value(2, [['&:hover', 3], ['&:hover', 4]]), value(2, [['&:hover', 5]]))))
  expect(compileCSS()).toContain('width: calc(4 * 5)')
})

test('显式复合状态键穿过表达式时仍按完整同键匹配', () => {
  const amount = value(2, [['&:hover', 4]])
  keep(rule('.example', 'width', value('1px', [[[condition('&:hover'), condition('&:active')], calcMultiply(amount, 3)]])))
  expect(compileCSS()).toContain('&:hover {\n&:active {\nwidth: calc(2 * 3)')
})

test('依赖只进入本次编译，删掉源条目后派生资源退出', () => {
  const nestedActive = vi.fn((): Rules => new Map([[[[condition(':root')], '--factor'], 3]]))
  const nested = value('3px', { onActive: nestedActive })
  const active = vi.fn((): Rules => new Map([[[[condition(':root')], '--size'], nested]]))
  const size = value('var(--size)', { onActive: active })
  const handle = keep(rule('.example', 'width', calcMultiply(size, size)))
  expect(active).not.toHaveBeenCalled()
  expect(compileCSS()).toContain('--factor: 3')
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
  expect(active).toHaveBeenCalledWith(expect.objectContaining({ path: [condition('.example'), condition('&:hover')], property: 'width' }))
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

test('逻辑变量按已有 Condition Key 读取和局部重定义派生 Custom Property', () => {
  const hover = condition('&:hover', 'hover')
  const active = condition('&:active', 'active')
  const foreground = variable('--fg', {
    fallback: value('black', [[hover, 'gray'], [active, 'silver']]),
    registration: { syntax: '*', inherits: true },
  })
  keep(rule('.example', foreground, value('red', [[hover, 'blue']])))
  keep(rules('.only-active', [declareVariable(foreground, { active: 'green', missing: 'orange' })]))
  keep(rules('.same-active', [declareVariable(foreground, { active: 'silver' })]))
  keep(rules('.example', [color(foreground)]))
  const css = compileCSS()
  expect(css).toContain('--fg: red')
  expect(css).toContain('--fg-when-hover: blue')
  expect(css).toContain('--fg-when-active: green')
  expect(css).toContain('.same-active {\n--fg-when-active: silver')
  expect(css).not.toContain('orange')
  expect(css).toContain('color: var(--fg, black)')
  expect(css).toContain('color: var(--fg-when-hover, gray)')
  expect(css).toContain('color: var(--fg-when-active, silver)')
  expect(css.match(/@property --fg/g)).toHaveLength(1)
})

test('简写扩写、长属性覆盖与复合字段保留', () => {
  keep(rules('.example', [margin('4px'), marginLeft('8px'), padding('1px', '2px', '3px'), border('red', '4px', 'solid'), font({ style: 'italic', size: '16px', lineHeight: 1.5, family: 'system-ui' })]))
  const css = compileCSS()
  expect(css).toContain('margin-left: 8px')
  expect(css).not.toContain('margin-left: 4px')
  expect(css).toContain('padding-bottom: 3px')
  expect(css).toContain('font: italic 16px/1.5 system-ui')
})

test('阴影与过渡追加内容保留状态和完整语法', () => {
  const shadow = boxShadow(shadowValue({ x: 0, y: value('2px', [['&:hover', '4px']]), color: 'black' }))
  const timing = transition(['opacity', '100ms', 'ease'])
  shadow.append(shadowValue({ x: 0, y: 0, spread: '1px', color: 'red' }))
  timing.append(['transform', '200ms', 'linear', '30ms'])
  keep(rules('.example', [shadow, timing]))
  expect(compileCSS()).toContain('box-shadow: 0 4px black, 0 0 0 1px red')
  expect(compileCSS()).toContain('transition: opacity 100ms ease, transform 200ms linear 30ms')
})

test('动画和函数激活完整资源，同名函数替换整个定义', () => {
  const opacity = variable('--fade-opacity', { root: { value: 1 } })
  const frames: Rules = new Map<RuleAddress, RuleValue>([[[[condition('from')], 'opacity'], 0], [[[condition('to')], 'opacity'], opacity]])
  keep(rule('.example', 'animation', animationValue({ name: animationName('fade', frames), duration: '1s' })))
  const oldBody: Rules = new Map<RuleAddress, RuleValue>([[[undefined, '--old-local'], '100px'], [[undefined, 'result'], value('16px', [[media('(width > 1px)'), '20px']])]])
  const nextBody: Rules = new Map([[[undefined, 'result'], '24px']])
  keep(rule('.first', 'width', cssFunction('--size() returns <length>', oldBody)()))
  keep(rule('.second', 'width', cssFunction('--size() returns <length>', nextBody)()))
  const css = compileCSS()
  expect(css).toContain('@keyframes fade')
  expect(css).toContain('--fade-opacity: 1')
  expect(css.match(/@function --size/g)).toHaveLength(1)
  expect(css).toContain('result: 24px')
  expect(css).not.toContain('--old-local')
  expect(css).not.toContain('20px')
})
