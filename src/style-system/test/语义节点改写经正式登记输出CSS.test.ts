/** 从正式登记验证节点改写、阶段边界和按需依赖。 */
import { afterEach, expect, test, vi } from 'vitest'
import { compileCSS } from '../css-root'
import { condition } from '../condition'
import { key, propertyName } from '../css-key'
import { rule, rules, type Rules, type RulesHandle, type RewriteRuleContent } from '../rule'
import { value } from '../value'
import { variable } from '../variable'
import { findStateCondition } from '../materials/state-conditions'
import { compileStyleNodes, buildStyleNodes } from '../compiler/compile-rules'
import type { ContentStyleNode } from '../compiler/style-nodes'

const handles: RulesHandle[] = []

afterEach(() => {
  for (const handle of handles.splice(0)) handle.remove()
})

/** 将本例登记纳入清理范围。 */
function keep<T extends RulesHandle>(handle: T): T {
  handles.push(handle)
  return handle
}

test('一项规则改写同批声明中的单项原始内容，并保留其他声明顺序', () => {
  const original = value('red')
  const seen = vi.fn()
  const rewrite: RewriteRuleContent = {
    rewriteStyleNodes(nodes, index, node) {
      seen({ index, path: node.conditionPath.map((item) => item.header), states: node.stateConditionPath.map((item) => item.name) })
      const target = nodes.find((entry) => entry.kind === 'content' && entry.key !== undefined && propertyName(entry.key) === 'color') as ContentStyleNode
      expect(target.value).toBe(original)
      target.value = 'blue'
      nodes.splice(index, 0, {
        kind: 'content', conditionPath: node.conditionPath, stateConditionPath: node.stateConditionPath,
        key: key('opacity'), value: { toCSSString: () => '0.7' },
      })
    },
  }
  keep(rules(['.Ast', 'hover'], [[key('color'), original], [key('display'), 'grid'], [key('color'), 'green']]))
  keep(rule(['.Ast', 'hover'], undefined, rewrite))
  const css = compileCSS()
  expect(seen).toHaveBeenCalledExactlyOnceWith({ index: 3, path: ['.Ast'], states: ['hover'] })
  expect([...css.matchAll(/(?:color|display|opacity):\s*([^;]+);/g)].map(([, text]) => text))
    .toEqual(['blue', 'grid', 'green', '0.7'])
  expect(css).toContain('hover')
})

test('状态身份留在原始节点的状态路径，普通条件只进入地址', () => {
  const source: Rules = [[[condition('.Ast'), condition('&:is(:hover)'), 'hover'], 'opacity', 0.5]]
  const nodes = buildStyleNodes(source)
  expect(nodes).toHaveLength(1)
  expect(nodes[0].conditionPath.map((item) => item.header)).toEqual(['.Ast', '&:is(:hover)'])
  expect(nodes[0].stateConditionPath.map((item) => item.name)).toEqual(['hover'])
})

test('parsed 节点只保留可输出内容，状态已并入普通输出地址', () => {
  const content = { toCSSString: () => '0.5' }
  const source: Rules = [[[condition('.Ast'), 'hover'], key('opacity'), content]]
  const parsed = compileStyleNodes(buildStyleNodes(source), {
    sourceRules: source, pendingDependencyRules: new Map(), activatedValues: new Set(), resolvingValues: new Set(),
  })
  expect(parsed.explicitNodes).toHaveLength(1)
  expect(parsed.explicitNodes[0].conditionPath.map((item) => item.header)).toEqual([
    '.Ast', ...buildStyleNodes(source)[0].stateConditionPath.map((item) => item.condition.header),
  ])
  expect(parsed.explicitNodes[0].value).toBe(content)
  expect(parsed.explicitNodes[0]).not.toHaveProperty('stateConditionPath')
})

test('空内容仍暴露已登记状态，改写复制该节点后沿原状态输出', () => {
  const rewrite: RewriteRuleContent = {
    rewriteStyleNodes(nodes, index) {
      const target = nodes.find((node) => node.kind === 'content'
        && node.stateConditionPath.some((state) => state.name === 'hover')) as ContentStyleNode
      expect(target.value).toBeUndefined()
      nodes.splice(index, 0, { ...target, value: 'blue' })
    },
  }
  keep(rule(['.AstUndefined', 'hover'], 'color', undefined))
  keep(rule('.AstUndefined', undefined, rewrite))
  const css = compileCSS()
  expect(css).toContain('color: blue;')
  expect(css).toContain('hover')
})

test('改写空内容节点的状态路径后，输出使用改写后的状态', () => {
  const rewrite: RewriteRuleContent = {
    rewriteStyleNodes(nodes) {
      const target = nodes.find((node) => node.kind === 'content' && node.value === undefined) as ContentStyleNode
      target.stateConditionPath = []
      target.value = 'blue'
    },
  }
  keep(rule(['.AstEdit', 'hover'], 'color', undefined))
  keep(rule('.AstEdit', undefined, rewrite))
  const css = compileCSS()
  expect(css).toContain('.AstEdit {\ncolor: blue;')
  expect(css).not.toContain('hover')
})

test('改写普通节点的状态后，Variable 自动定义采用新作用域', () => {
  const reference = variable('red', { name: 'ast-scope', states: { hover: 'blue' } })
  const rewrite: RewriteRuleContent = {
    rewriteStyleNodes(nodes) {
      const target = nodes.find((node) => node.kind === 'content') as ContentStyleNode
      target.stateConditionPath = [findStateCondition('active')!]
    },
  }
  keep(rule(['.AstScope', 'hover'], 'color', reference))
  keep(rule('.AstScope', undefined, rewrite))
  const css = compileCSS()
  expect(css).toMatch(/&:where\([^\n]*active[^\n]*\) \{\n--ast-scope: red;/)
  expect(css).not.toMatch(/&:where\([^\n]*hover[^\n]*\) \{\n--ast-scope: red;/)
  expect(css).toContain('color: var(--ast-scope, red);')
})

test('最初特殊节点按身份调度，被删除者跳过，后续节点收到当前实际位置', () => {
  const calls: string[] = []
  const discarded: RewriteRuleContent = { rewriteStyleNodes() { calls.push('被删除') } }
  const later: RewriteRuleContent = {
    rewriteStyleNodes(nodes, index) {
      calls.push(`后续:${index}`)
      nodes.splice(index, 0, { kind: 'content', conditionPath: [condition('.Schedule')], stateConditionPath: [], key: key('color'), value: 'blue' })
    },
  }
  const first: RewriteRuleContent = {
    rewriteStyleNodes(nodes, index) {
      calls.push(`先执行:${index}`)
      const removed = nodes.findIndex((node) => node.kind === 'rewrite' && node.value === discarded)
      nodes.splice(removed, 1)
      nodes.splice(index, 0, { kind: 'content', conditionPath: [condition('.Schedule')], stateConditionPath: [], key: key('color'), value: 'red' })
    },
  }
  keep(rule('.Schedule', undefined, first))
  keep(rule('.Schedule', undefined, discarded))
  keep(rule('.Schedule', 'display', 'grid'))
  keep(rule('.Schedule', undefined, later))
  expect(compileCSS()).toContain('color: red;\ndisplay: grid;\ncolor: blue;')
  expect(calls).toEqual(['先执行:0', '后续:2'])
})

test('按需依赖自身的特殊 Rule 也通过同一改写阶段', () => {
  const rewrite: RewriteRuleContent = {
    rewriteStyleNodes(nodes, index, node) {
      nodes.splice(index, 0, { kind: 'content', conditionPath: node.conditionPath, stateConditionPath: [], key: key('--dependency'), value: 'ready' })
    },
  }
  const dependent = value('var(--dependency)', {
    onActive: (): Rules => [[[condition(':root')], undefined, rewrite]],
  })
  keep(rule('.Dependency', 'color', dependent))
  const css = compileCSS()
  expect(css).toContain('color: var(--dependency);')
  expect(css).toContain(':root {\n--dependency: ready;')
})

test('rules 批量登记的特殊内容也能改写普通节点', () => {
  const rewrite: RewriteRuleContent = {
    rewriteStyleNodes(nodes, index, node) {
      nodes.splice(index, 0, {
        kind: 'content', conditionPath: node.conditionPath, stateConditionPath: node.stateConditionPath,
        key: node.key, value: 'blue',
      })
    },
  }
  keep(rules('.BatchAst', [[key('color'), 'red'], [key('color'), rewrite]]))
  expect(compileCSS()).toContain('color: red;\ncolor: blue;')
})

test('改写新增的特殊节点不递归执行，编译失败不会返回部分 CSS', () => {
  const nested = vi.fn()
  const generated: RewriteRuleContent = { rewriteStyleNodes: nested }
  const first: RewriteRuleContent = {
    rewriteStyleNodes(nodes, index, node) {
      nodes.splice(index, 0, { ...node, value: generated })
    },
  }
  keep(rule('.Failed', undefined, first))
  expect(() => compileCSS()).toThrow('仍有特殊节点')
  expect(nested).not.toHaveBeenCalled()
})

test('无内容的 Variable 分支仍暴露已登记状态，并激活目标依赖', () => {
  const reference = variable(undefined, { name: 'ast-empty-target', root: { value: '12px' } })
  keep(rule('.Empty', reference, [['hover', undefined]]))
  const css = compileCSS()
  expect(css).toContain('--ast-empty-target: 12px;')
  expect(css).not.toContain('.Empty')
  const rewrite: RewriteRuleContent = {
    rewriteStyleNodes(nodes) {
      const target = nodes.find((node) => node.kind === 'content' && node.key === reference) as ContentStyleNode
      expect(target.stateConditionPath.map((state) => state.name)).toEqual(['hover'])
      target.value = '20px'
    },
  }
  keep(rule('.Empty', undefined, rewrite))
  expect(compileCSS()).toContain('--ast-empty-target: 20px;')
})

test('无内容的未知状态也不能静默成为普通内容', () => {
  const reference = variable(undefined, { name: 'ast-unknown-target' })
  keep(rule('.Unknown', reference, [['notRegistered', undefined]]))
  expect(() => compileCSS()).toThrow('未知 State Condition')
})
