/** 控制器的查询、位置与来源关系契约。 */
import { expect, it } from 'vitest'
import { condition } from '../condition'
import { key } from '../key'
import { ASTSession, createASTController } from './ast-controller'
import type { JSSStyleNode } from './rules-to-style-nodes'

function node(name: string): JSSStyleNode {
  return { conditionPath: { targetConditionPath: [condition('.controller')], stateConditionPath: [] }, key: name, content: name, compileRevision: 0 }
}

it('查询字段取交集并按属性名与地址匹配，返回独立的有序快照', () => {
  const owner = node('owner')
  const session = new ASTSession([owner])
  const ast = createASTController(session)
  const productTag = {}
  const first = ast.insert({ before: owner, conditionPath: owner.conditionPath }, [key('width'), 1], { owner, productTag, resourceAddress: 'resource' })
  const second = ast.insert({ before: owner, conditionPath: owner.conditionPath }, ['width', 2], { owner, productTag, resourceAddress: 'other' })
  const query = { key: key('width'), conditionPath: node('unused').conditionPath, productTag }
  expect(ast.search(query)).toEqual([first, second])
  expect(ast.search({ ...query, resourceAddress: 'resource' })).toEqual([first])
  expect(ast.has({ ...query, resourceAddress: 'missing' })).toBe(false)
  expect(ast.has(query)).toBe(true)
  ast.search(query).pop()
  ast.nodes().pop()
  expect(ast.search(query)).toEqual([first, second])
})

it('插入位置与来源独立，只有来源撤销才清理产物', () => {
  const owner = node('owner')
  const anchor = node('anchor')
  const ast = createASTController(new ASTSession([owner, anchor]))
  const product = ast.insert({ after: anchor, conditionPath: owner.conditionPath }, ['width', 1], { owner })
  expect(ast.nodes()).toEqual([owner, anchor, product])
  ast.remove(anchor)
  expect(ast.search({ key: 'width' })).toEqual([product])
  ast.remove(owner)
  expect(ast.has({ key: 'width' })).toBe(false)
})

it('显式以上次返回节点为锚点保持插入顺序，move 放到紧邻位置', () => {
  const owner = node('owner')
  const gap = node('gap')
  const anchor = node('anchor')
  const ast = createASTController(new ASTSession([owner, gap, anchor]))
  const first = ast.insert({ after: owner, conditionPath: owner.conditionPath }, ['width', 1], { owner })
  const second = ast.insert({ after: first, conditionPath: owner.conditionPath }, ['height', 2], { owner })
  expect(ast.nodes()).toEqual([owner, first, second, gap, anchor])
  ast.move(first, { before: anchor })
  expect(ast.nodes()).toEqual([owner, second, gap, first, anchor])
  ast.move(first, { after: owner })
  expect(ast.nodes()).toEqual([owner, first, second, gap, anchor])
})

it('depend 增加消费者，查询不会增加消费者，最后消费者撤销时清理产物', () => {
  const first = node('first')
  const second = node('second')
  const session = new ASTSession([first, second])
  const a = createASTController(session)
  const b = createASTController(session)
  const kept = a.insert({ before: first, conditionPath: first.conditionPath }, ['width', 1], { owner: first })
  a.insert({ before: first, conditionPath: first.conditionPath }, ['height', 2], { owner: first })
  b.search({ key: 'height' })
  b.depend(kept, { owner: second })
  a.remove(first)
  expect(b.search({ key: 'width' })).toEqual([kept])
  expect(b.has({ key: 'height' })).toBe(false)
  b.remove(second)
  expect(b.has({ key: 'width' })).toBe(false)
})

it('仅退出输出保留来源与清理回调，之后撤销执行一次清理', () => {
  const owner = node('owner')
  const ast = createASTController(new ASTSession([owner]))
  const child = ast.insert({ before: owner, conditionPath: owner.conditionPath }, ['width', 1], { owner })
  let cleaned = 0
  ast.onRemove(owner, () => { cleaned++ })
  ast.defer(owner, '等待')
  expect(owner.deferredReason?.message).toBe('等待')
  ast.remove(owner, { from: 'output' })
  expect(owner.deferredReason).toBeUndefined()
  expect(cleaned).toBe(0)
  expect(ast.search({ key: 'width' })).toEqual([child])
  ast.remove(owner)
  ast.remove(owner)
  expect(cleaned).toBe(1)
  expect(ast.has({ key: 'width' })).toBe(false)
})

it('控制器没有当前位置、会话身份或编译波字段', () => {
  const ast = createASTController(new ASTSession([node('owner')]))
  for (const field of ['node', 'session', 'conditionPath', 'key', 'content', 'role', 'readState', 'compileWaveIndex'])
    expect(field in ast).toBe(false)
})

it('同锚点后插每次紧邻锚点，外部移动不沿用旧插入游标', () => {
  const owner = node('owner')
  const anchor = node('anchor')
  const ast = createASTController(new ASTSession([owner, anchor]))
  const position = { after: owner, conditionPath: owner.conditionPath }
  const first = ast.insert(position, ['width', 1], { owner })
  const second = ast.insert(position, ['height', 2], { owner })
  expect(ast.nodes()).toEqual([owner, second, first, anchor])
  ast.move(first, { after: anchor })
  ast.move(owner, { after: first })
  const third = ast.insert(position, ['opacity', 3], { owner })
  expect(ast.nodes()).toEqual([second, anchor, first, owner, third])
  expect(new Set([first.identity, second.identity, third.identity]).size).toBe(3)
})
