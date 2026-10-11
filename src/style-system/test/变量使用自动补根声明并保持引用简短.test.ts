/** 通过正式编译入口验证引用、全树声明查找和按需根声明的撤销。 */
import { expect, test } from 'vitest'
import { compileRules } from '../css-root'
import { declare } from '../declaration'
import { variable } from '../variable'
import type { JSSContent } from '../content'
import { variableCluster } from '../variable-cluster'

test('Cluster 作为原始声明目标时按其默认成员身份判断已有定义', () => {
  const color = variable('white', 'root-cluster-default')
  const cluster = variableCluster({ default: color })
  const css = compileRules([[['.Other'], cluster, 'red'], [['.Consumer'], 'color', color]])
  expect(css).toContain('--root-cluster-default: red;')
  expect(css).not.toContain(':root')
  expect(css).not.toContain('white')
})

test('使用未声明变量时补根声明，引用没有默认内容参数', () => {
  const color = variable('white', 'root-contract-color')
  const css = compileRules([[['.Consumer'], 'color', color], [['.Other'], 'background-color', color]])
  expect(css).toContain(':root {\n--root-contract-color: white;\n}')
  expect(css).toContain('color: var(--root-contract-color);')
  expect(css).not.toContain('var(--root-contract-color,')
  expect(css.match(/--root-contract-color:\s*white;/g)).toHaveLength(1)
})

test('多层引用各自声明一条关系，使用处不展开依赖链', () => {
  const paper = variable('white', 'root-chain-paper')
  const canvas = variable(paper, 'root-chain-canvas')
  const surface = variable(canvas, 'root-chain-surface')
  let unusedCalls = 0
  variable(() => { unusedCalls++; return 'red' }, 'root-chain-unused')
  const css = compileRules([[['.Consumer'], 'color', surface]])
  const root = css.match(/:root\s*\{([^}]+)\}/)?.[1] ?? ''
  expect(root).toContain('--root-chain-paper: white;')
  expect(root).toContain('--root-chain-canvas: var(--root-chain-paper);')
  expect(root).toContain('--root-chain-surface: var(--root-chain-canvas);')
  expect(css).toContain('color: var(--root-chain-surface);')
  expect(css).not.toMatch(/var\([^)]*,/)
  expect(css).not.toContain('root-chain-unused')
  expect(unusedCalls).toBe(0)
})

test.each([false, true])('全树任意位置已有显式声明，不补根默认；声明在引用前=%s', (before) => {
  const color = variable('white', 'root-explicit-color')
  const definition = [['.Other'], ...declare(color, 'red')] as Parameters<typeof compileRules>[0][number]
  const consumption = [['.Consumer'], 'color', color] as Parameters<typeof compileRules>[0][number]
  const css = compileRules(before ? [definition, consumption] : [consumption, definition])
  expect(css).toContain('--root-explicit-color: red;')
  expect(css).toContain('color: var(--root-explicit-color);')
  expect(css).not.toContain(':root')
  expect(css).not.toContain('white')
})

test('同 CSS 名称的另一对象声明不替代被引用对象的根基础定义', () => {
  const declared = variable('white', 'root-shared-name')
  const consumed = variable('blue', 'root-shared-name')
  const css = compileRules([[['.Other'], ...declare(declared, 'red')], [['.Consumer'], 'color', consumed]])
  expect(css).toMatch(/:root\s*\{[^}]*--root-shared-name:\s*blue;/)
  expect(css).toContain('--root-shared-name: red;')
  expect(css).toContain('color: var(--root-shared-name);')
  expect(css).not.toContain('white')
})

test('后续编译波按需生成显式声明时不留下根默认', () => {
  const color = variable('white', 'root-late-color')
  const later: JSSContent = { compileWaveIndex: 2, onCompile(context, controller) {
    controller.setContent(context, { onActive: () => [[['.Other'], ...declare(color, 'red')]] })
  } }
  const css = compileRules([[['.Consumer'], 'color', color], [[], 'display', later]])
  expect(css).toContain('--root-late-color: red;')
  expect(css).toContain('color: var(--root-late-color);')
  expect(css).not.toContain(':root')
  expect(css).not.toContain('white')
})

test('默认材料激活同变量显式声明时取消根默认，显式产物继续存活', () => {
  const content: JSSContent = { toCSSString: () => 'white',
    onActive: () => [[['.Other'], ...declare(color, 'red')]],
  }
  const color = variable(content, 'root-default-active-color')
  const css = compileRules([[['.Consumer'], 'color', color]])
  expect(css).toContain('--root-default-active-color: red;')
  expect(css).not.toContain('white')
  expect(css).not.toContain(':root')
})

test('最后显式声明撤销后按最终全树结果恢复根声明', () => {
  const color = variable('white', 'root-removed-definition')
  const definition = declare(color, 'red')
  const css = compileRules([
    [['.Consumer'], 'color', color], [['.Other'], ...definition],
    [[], 'display', { compileWaveIndex: 2, onCompile(context, controller) {
      controller.remove(controller.search({ key: color.key }).find(node => node.content === definition[1])!)
      controller.remove(context.node)
    } }],
  ])
  expect(css).toContain(':root {\n--root-removed-definition: white;\n}')
  expect(css).not.toContain('red')
})

test.each([false, true])('消费者撤销后清理自动根声明，其他消费者仍存在=%s', (shared) => {
  const paper = variable('white', 'root-shared-paper')
  const canvas = variable(paper, 'root-shared-canvas')
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
