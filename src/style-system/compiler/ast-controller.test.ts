/** AST 控制器的行为契约测试。
 *
 * 验证查询、位置编辑与依赖来源的生命周期。
 *
 * 防止输出退出和真正撤销被混为同一状态。
 */
import { expect, it, vi } from 'vitest'
import { condition } from '../condition'
import { key } from '../key'
import { ASTSession, createASTController } from './ast-controller'
import type { JSSStyleNode } from './rules-to-style-nodes'

/** 构造同一地址的测试节点，用名称区分声明目标。 */
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

it('has 首项命中便停止，search 有序收集，查询侧名称与地址各求值一次', () => {
  let candidateReads = 0
  let queryKeyReads = 0
  let queryPathReads = 0
  const candidates = Array.from({ length: 100 }, () => ({
    ...node('candidate'),
    key: { toCSSString: () => { candidateReads++; return '--match' } },
  }))
  const ast = createASTController(new ASTSession(candidates))
  const query = {
    key: { toCSSString: () => { queryKeyReads++; return '--match' } },
    conditionPath: { targetConditionPath: [{ get header() { queryPathReads++; return '.controller' } }], stateConditionPath: [] },
  }
  expect(ast.has(query)).toBe(true)
  expect([candidateReads, queryKeyReads, queryPathReads]).toEqual([1, 1, 1])
  candidateReads = queryKeyReads = queryPathReads = 0
  expect(ast.search(query)).toEqual(candidates)
  expect([candidateReads, queryKeyReads, queryPathReads]).toEqual([100, 1, 1])
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

it('来源登记拒绝已撤销 owner，允许退出输出的来源及尚未入队的产物', () => {
  const first = node('first')
  const second = node('second')
  const session = new ASTSession([first, second])
  const ast = createASTController(session)
  const product = ast.insert({ before: first, conditionPath: first.conditionPath }, ['width', 1], { owner: first })
  let cleaned = 0
  ast.onRemove(product, () => { cleaned++ })
  ast.remove(second)
  expect(() => ast.depend(product, { owner: second })).toThrow('已撤销来源')
  expect(() => session.own(second, product)).toThrow('已撤销来源')
  expect(() => session.own(second, second)).toThrow('已撤销来源')
  ast.remove(first)
  ast.remove(product)
  expect(ast.has({ key: 'width' })).toBe(false)
  expect(cleaned).toBe(1)

  const source = node('source')
  const detached = node('detached')
  const nextSession = new ASTSession([source, detached])
  const next = createASTController(nextSession)
  const pending = node('pending')
  nextSession.own(source, pending)
  nextSession.append([pending])
  next.remove(detached, { from: 'output' })
  next.depend(pending, { owner: detached })
  next.remove(source)
  expect(nextSession.isAlive(pending)).toBe(true)
  next.remove(detached)
  expect(nextSession.isAlive(pending)).toBe(false)
})

it('撤销无关来源不遍历其他消费者关系，共享与级联清理仍保持', () => {
  const unused = node('unused')
  const owner = node('owner')
  const session = new ASTSession([unused, owner])
  const ast = createASTController(session)
  const products = Array.from({ length: 100 }, (_, index) => ast.insert(
    { before: owner, conditionPath: owner.conditionPath }, [`--product-${index}`, index], { owner },
  ))
  const originalDelete = Set.prototype.delete
  let visits = 0
  const deletion = vi.spyOn(Set.prototype, 'delete').mockImplementation(function (this: Set<unknown>, value) {
    if (value === unused) visits++
    return originalDelete.call(this, value)
  })
  try { ast.remove(unused) } finally { deletion.mockRestore() }
  expect(visits).toBeLessThanOrEqual(3)
  expect(ast.nodes()).toEqual([...products, owner])
  const shared = node('shared')
  session.append([shared])
  ast.depend(products[0], { owner: shared })
  const child = ast.insert({ before: products[0], conditionPath: owner.conditionPath }, ['height', '1px'], { owner: products[0] })
  let cleanups = 0
  ast.onRemove(child, () => { cleanups++; ast.remove(child) })
  ast.remove(shared, { from: 'output' })
  ast.remove(owner)
  expect(ast.nodes()).toEqual([child, products[0]])
  ast.remove(shared)
  expect(ast.nodes()).toEqual([])
  expect(cleanups).toBe(1)
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
