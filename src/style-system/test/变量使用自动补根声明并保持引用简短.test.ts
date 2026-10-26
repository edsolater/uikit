import { token } from '../token'
/** 含当前根发布方案的输出检查；默认可用、当地覆盖等可观察目的由浏览器案例验证。 */
import { expect, test } from 'vitest'
import { compileRules } from '../css-root'
import { declare } from '../operations/declare'
import type { JSSContent } from '../content'
import { key } from '../key'
import { condition } from '../condition'
import { multiply } from '../pieces/contents/functions/calc'

test('root已有同CSS名声明时保留既有基础，不要求同Token对象', () => {
  const size = token('4px', 'root-existing-css-name')
  const css = compileRules([
    [[':root'], ...declare(key('--root-existing-css-name'), '6px')],
    [['.Consumer'], 'width', size],
  ])
  expect(css).toContain('--root-existing-css-name: 6px;')
  expect(css).not.toContain('--root-existing-css-name: 4px;')
  expect(css).toContain('width: var(--root-existing-css-name);')
})

test.each(['before', 'after'] as const)('晚到显式根声明插在自动保障的 %s，状态仍以显式 9px 为基础', position => {
  const size = token('2px', { name: `late-root-${position}`, state: { '&[data-late-state]': base => multiply(base, 2) } })
  const trigger = token(1, { compileWaveIndex: 2, onCompile(context, ast) {
    const nodes = ast.nodes()
    const anchor = position === 'before' ? { before: nodes[0] } : { after: nodes.at(-1)! }
    ast.insert({ ...anchor, conditionPath: { targetConditionPath: [condition(':where(:root)')], stateConditionPath: [] } }, declare(size, '9px'), { owner: context.node })
  } })
  const css = compileRules([[['.LateConsumer'], 'width', size], [['.LateTrigger'], 'order', trigger]])
  expect(css).toContain(`--late-root-${position}: 9px;`)
  expect(css).toContain(`--late-root-${position}: calc(9px * 2);`)
  expect(css).not.toContain(`--late-root-${position}: 2px;`)
  expect(css).not.toContain(`--late-root-${position}: calc(2px * 2);`)
})

test('使用未声明变量时补根声明，引用没有默认内容参数', () => {
  const color = token('white', 'root-contract-color')
  const css = compileRules([[['.Consumer'], 'color', color], [['.Other'], 'background-color', color]])
  expect(css).toContain(':where(:root) {\n--root-contract-color: white;\n}')
  expect(css).toContain('color: var(--root-contract-color);')
  expect(css).not.toContain('var(--root-contract-color,')
})

test('多层引用各自声明一条关系，使用处不展开依赖链', () => {
  const paper = token('white', 'root-chain-paper')
  const canvas = token(paper, 'root-chain-canvas')
  const surface = token(canvas, 'root-chain-surface')
  let unusedCalls = 0
  token(() => { unusedCalls++; return 'red' }, 'root-chain-unused')
  const css = compileRules([[['.Consumer'], 'color', surface]])
  const root = css.match(/:root\)?\s*\{([^}]+)\}/)?.[1] ?? ''
  expect(root).toContain('--root-chain-paper: white;')
  expect(root).toContain('--root-chain-canvas: var(--root-chain-paper);')
  expect(root).toContain('--root-chain-surface: var(--root-chain-canvas);')
  expect(css).toContain('color: var(--root-chain-surface);')
  expect(css).not.toMatch(/var\([^)]*,/)
  expect(css).not.toContain('root-chain-unused')
  expect(unusedCalls).toBe(0)
})

test.each([false, true])('无关位置的显式声明不抑制消费默认；声明在引用前=%s', (before) => {
  const color = token('white', `root-explicit-color-${before}`)
  const definition = [['.Other'], ...declare(color, 'red')] as Parameters<typeof compileRules>[0][number]
  const consumption = [['.Consumer'], 'color', color] as Parameters<typeof compileRules>[0][number]
  const css = compileRules(before ? [definition, consumption] : [consumption, definition])
  expect(css).toContain(`--root-explicit-color-${before}: red;`)
  expect(css).toContain(`color: var(--root-explicit-color-${before});`)
  expect(css).toContain(':root')
  expect(css).toContain('white')
})

test('同 CSS 名称的另一对象声明不替代被引用对象的根基础定义', () => {
  const declared = token('white', 'root-shared-name')
  const consumed = token('blue', 'root-shared-name')
  const css = compileRules([[['.Other'], ...declare(declared, 'red')], [['.Consumer'], 'color', consumed]])
  expect(css).toMatch(/:root\)?\s*\{[^}]*--root-shared-name:\s*blue;/)
  expect(css).toContain('--root-shared-name: red;')
  expect(css).toContain('color: var(--root-shared-name);')
  expect(css).not.toContain('white')
})

test('后续编译波生成无关位置声明时，消费默认仍保留', () => {
  const color = token('white', 'root-late-color')
  const later: JSSContent = { compileWaveIndex: 2, onCompile(context, controller) {
    controller.setContent(context, { onFirstScan: () => [[['.Other'], ...declare(color, 'red')]] })
  } }
  const css = compileRules([[['.Consumer'], 'color', color], [[], 'display', later]])
  expect(css).toContain('--root-late-color: red;')
  expect(css).toContain('color: var(--root-late-color);')
  expect(css).toContain(':root')
  expect(css).toContain('white')
})

test('默认材料激活无关位置声明时，默认及显式产物同时存活', () => {
  const content: JSSContent = { toCSSString: () => 'white',
    onFirstScan: () => [[['.Other'], ...declare(color, 'red')]],
  }
  const color = token(content, 'root-default-active-color')
  const css = compileRules([[['.Consumer'], 'color', color]])
  expect(css).toContain('--root-default-active-color: red;')
  expect(css).toContain('white')
  expect(css).toContain(':root')
})

test('最后显式声明撤销后消费保留根默认', () => {
  const color = token('white', 'root-removed-definition')
  const definition = declare(color, 'red')
  const css = compileRules([
    [['.Consumer'], 'color', color], [['.Other'], ...definition],
    [[], 'display', { compileWaveIndex: 2, onCompile(context, controller) {
      controller.remove(controller.search({ key: color }).find(node => node.content === definition[1])!)
      controller.remove(context.node)
    } }],
  ])
  expect(css).toContain(':where(:root) {\n--root-removed-definition: white;\n}')
  expect(css).not.toContain('red')
})

test.each([false, true])('消费者撤销后清理自动根声明，其他消费者仍存在=%s', (shared) => {
  const paper = token('white', 'root-shared-paper')
  const canvas = token(paper, 'root-shared-canvas')
  const rules: Parameters<typeof compileRules>[0] = [[['.Consumer'], 'color', canvas]]
  if (shared) rules.push([['.Consumer'], 'background-color', canvas])
  rules.push([[], 'display', { compileWaveIndex: 3, onCompile(context, controller) {
    controller.remove(controller.search({ key: 'color' })[0]!)
    controller.remove(context.node)
  } }])
  const css = compileRules(rules)
  expect(css.includes('--root-shared-paper: white;')).toBe(shared)
  expect(css.includes('--root-shared-canvas: var(--root-shared-paper);')).toBe(shared)
  expect(css).not.toMatch(/(?:^|\n)color: var\(--root-shared-canvas\);/)
  if (!shared) expect(css).toBe('')
})

test('更窄条件覆盖不抑制普通派生默认，真正祖先覆盖继续生效', () => {
  const source = token('blue', 'position-source')
  const surface = token(source, 'position-surface')
  const css = compileRules([
    [['.Button'], 'color', surface],
    [['.Button', '&[data-danger]'], ...declare(source, 'red')],
  ])
  expect(css).toContain('--position-source: blue;')
  expect(css).toContain('--position-source: red;')
  expect(css).toContain('--position-surface: var(--position-source);')
  const scoped = compileRules([
    [['.Panel'], ...declare(source, 'green')],
    [['.Panel', '.Child'], 'color', surface],
  ])
  expect(scoped).toContain('--position-source: green;')
})
