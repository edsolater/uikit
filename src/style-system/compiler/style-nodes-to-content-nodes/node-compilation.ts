/** 本次内容编译的节点角色与访问进度。
 *
 * 推进 Key 与 Content，交付已完成声明及子内容的解析结果。
 *
 * 将跨波进度和内容链访问留在同一责任内，供编排统一推进。
 */
import { assert, isArray, isIndexNumber, isObjectLike, isString, isNumber, isUndefined, isFunction, result } from '@edsolater/fnkit'
import { conditionAddressKey, outputConditionPath, type ConditionPath, type CSSConditionPath } from '../../condition'
import type { JSSKey } from '../../key'
import type { Rules } from '../../rule'
import { isJSSContent, hasJSSContentOnFirstScanMethod, hasJSSContentOnCompileMethod, hasJSSContentOutput, type JSSCompileContext, type JSSContent } from '../../content'
import { isToken } from '../../token/core'
import { cssPreparation } from '../../token/css'
import { prepareCSSDeclaration, isCSSDefinitionControl } from '../../token/declare'
import type { TokenCompilation } from '../../token/compilation'
import type { ASTSession, RoleCompilationState } from '../ast-controller'
import type { ResourceCompilation } from './resource-compilation'
import type { JSSStyleNode, ASTController, ContentCompilationRecord, JSSContentNode } from '../contracts'

/** 为当前输入建立未访问的角色；不含编译行为的 Key 可直接参与输出。 */
const roleCompilationState = (input: unknown, role: JSSCompileContext['role']): RoleCompilationState => ({
  input,
  contents: new WeakMap(),
  visitedContents: new Set(),
  complete: role === 'declaration-key' && !hasJSSContentOnCompileMethod(input) && !isToken(input),
})

/** 本次编译允许调用 onCompile 的总次数。 */
interface CompileBudget {
  operations: number
  maximumOperations: number
}

/** 在一次角色访问中推进内容链，交付内容及完成度；子步骤共用当次回调输入与递归约束。 */
function visitContent(
  input: unknown,
  context: Omit<JSSCompileContext, 'input'>,
  controller: ASTController,
  session: ASTSession,
  wave: number,
  state: RoleCompilationState,
  budget: CompileBudget,
  activate: (content: JSSContent) => void,
  tokens: TokenCompilation,
): boolean {
  const activeObjects = new Set<object>()
  return visit(input)

  /** 在当前编译波访问 Key 或 Content 链，交回当前位置的内容及是否仍需后续波。 */
  function visit(input: unknown, depth = 0): boolean {
    if (!session.hasOutput(context.node)) return true
    assert(depth <= 256, 'Content 编译嵌套超过上限 256，编译无法终止。')
    if (isUndefined(input) || isString(input) || isNumber(input)) return true
    assert(isObjectLike(input), '无效的 CSS 内容。')
    assert(!activeObjects.has(input), 'CSS 内容存在循环引用，无法生成 CSS。')
    activeObjects.add(input)
    state.visitedContents.add(input)
    try {
      let record = state.contents.get(input)
      if (!record) { record = { content: input, notified: false }; state.contents.set(input, record) }
      if (isFunction(input) && !isJSSContent(input)) {
        if (!record.notified) { record.content = result(input); record.notified = true }
        return visit(record.content, depth + 1)
      }
      if (hasJSSContentOnFirstScanMethod(input)) activate(input)

      return hasJSSContentOnCompileMethod(input)
        ? compile(input, depth)
        : prepare(input, depth)
    } finally {
      activeObjects.delete(input)
    }
  }

  /** 执行当前对象的一次编译并延续替代链；跨波复用进度，完成结果仍绑定原对象。 */
  function compile(input: JSSContent & Required<Pick<JSSContent, 'onCompile'>>, depth: number): boolean {
    const record = state.contents.get(input)!
    const earliestWave = input.compileWaveIndex ?? 0
    assert(isIndexNumber(earliestWave), 'compileWaveIndex 必须是非负整数。')
    if (!record?.notified && earliestWave > wave) {
      visitChildren(input, depth)
      return false
    }
    if (!record.notified) {
      let shared = session.objectCompilations.get(input)
      if (!shared) {
        shared = { content: input, notified: false }
        session.objectCompilations.set(input, shared)
      }
      if (!shared.notified) {
        budget.operations++
        assert(budget.operations <= budget.maximumOperations, `AST 编译操作超过上限 ${budget.maximumOperations}，编译无法终止。`)
        const notification: JSSCompileContext = { ...context, input }
        record.notifyingContext = notification
        try { input.onCompile(notification, controller) }
        finally { delete record.notifyingContext }
        shared.content = record.content
        shared.notified = true
      }
      record.content = shared.content
      record.notified = true
      delete record.dependencies
    }
    if (!session.hasOutput(context.node)) return true
    return record.content === input ? prepare(input, depth) : visit(record.content, depth + 1)
  }

  /** 在当前位置准备内部 CSS 操作；它不属于对象的 onCompile 生命周期。 */
  function prepare(input: object, depth: number): boolean {
    const record = state.contents.get(input)!
    if (record.content !== input) return visit(record.content, depth + 1)
    const notification: JSSCompileContext = { ...context, input: input as JSSContent }
    const operation = cssPreparation(input)
    if (operation && !record.notified) {
      const before = context.node.deferredReason
      record.notifyingContext = notification
      try { operation(notification, controller) }
      finally { delete record.notifyingContext }
      record.notified = before === context.node.deferredReason
      if (!record.notified) return false
    }
    const declaration = prepareCSSDeclaration(input, notification, controller)
    if (declaration !== input) record.content = declaration
    else if (isToken(input)) record.content = tokens.prepare(input, notification)
    if (record.content !== input) return visit(record.content, depth + 1)
    return visitChildren(input, depth)
  }

  /** 访问依赖并判断当前输出；无输出对象等待依赖完成后才从内容链消失。 */
  function visitChildren(input: object, depth: number): boolean {
    const record = state.contents.get(input)!
    if (!('dependencies' in record)) {
      const dependencyValue = 'dependencies' in input ? input.dependencies : undefined
      record.dependencies = isArray(dependencyValue) ? dependencyValue.slice() : undefined
    }
    const dependencies = record.dependencies
    let complete = true
    for (const child of dependencies ?? []) {
      const finished = visit(child, depth + 1)
      complete &&= finished
    }

    if (hasJSSContentOutput(input) || hasJSSContentOnCompileMethod(input) || dependencies || hasJSSContentOnFirstScanMethod(input)) return complete
    throw new Error('无效的 CSS 内容。')
  }
}

/** 本次编译的节点角色进度；逐波访问、输入失效与当前队列的完成判断由此统一负责。 */
export class NodeCompilation {
  private budget: CompileBudget = { operations: 0, maximumOperations: 100_000 }
  private pending = new Set<JSSStyleNode>()
  private visiting?: JSSStyleNode[]
  private current?: JSSStyleNode

  /**
   * 接收AST中新增或输入改变的位置；已完成且未改变的节点不进入下一波。
   */
  constructor(private session: ASTSession, private controller: ASTController, private sourceRules: Rules, private resources: ResourceCompilation, private tokens: TokenCompilation) {
    controller.observeNodes((node, present) => {
      if (!present) { this.pending.delete(node); return }
      const state = session.compilations.get(node)
      if (state?.key.complete && state.content.complete && state.version === node.compileRevision
        && state.address === conditionAddressKey(node.conditionPath)
        && state.key.input === node.key && state.content.input === node.content) return
      this.pending.add(node)
      // 已有位置在轮到前改变，仍按本波顺序访问；本波新增节点留到下一波。
      if (this.visiting && this.current && this.session.compilations.has(node)
        && this.session.compareOrder(node, this.current) > 0 && !this.visiting.includes(node)) {
        const index = this.visiting.findIndex(item => this.session.compareOrder(item, node) > 0)
        this.visiting.splice(index < 0 ? this.visiting.length : index, 0, node)
      }
    })
  }

  /**
   * 只访问本波受影响的位置；新增、改写及未完成的内容留给下一波。
   */
  visit(compileWaveIndex: number): void {
    this.visiting = [...this.pending].sort((left, right) => this.session.compareOrder(left, right))
    for (const node of this.visiting) {
      this.current = node
      this.pending.delete(node)
      if (!this.session.hasOutput(node)) continue
      this.visitNode(node, compileWaveIndex)
      this.invalidate(node)
      const state = this.session.compilations.get(node)!
      if (!state.key.complete || !state.content.complete) this.pending.add(node)
    }
    this.visiting = undefined
    this.current = undefined
  }

  /** 波末核对当前输入；全部角色完成时返回 true，否则继续后续波；暂缓无推进来源时抛出实际原因。 */
  settle(): boolean {
    return this.isReady()
  }

  /** 取得原贡献在自身位置的解析结果，供稳定聚合惰性读取。 */
  compiledContents(node: JSSStyleNode): WeakMap<object, ContentCompilationRecord> {
    return this.session.compilations.get(node)!.content.contents
  }

  /** 将已完成且被选择的当前位置交付输出，不泄漏角色访问账本。 */
  outputs(select: (node: JSSStyleNode) => boolean): JSSContentNode[] {
    return this.session.nodes.flatMap((node) => {
      const state = this.session.compilations.get(node)
      if (!select(node) || isCSSDefinitionControl(node) || !state?.key.complete || !state.content.complete) return []
      return [{ conditionPath: outputConditionPath(node.conditionPath), key: node.key, content: node.content, compiledContents: state.content.contents }]
    })
  }

  /** Key／Content／revision 改变时重建对应角色；访问前与波末调用同一规则。 */
  private invalidate(node: JSSStyleNode): void {
    const state = this.session.compilations.get(node)
    if (!state) return
    let changed = false
    for (const name of ['key', 'content'] as const) {
      if (state.version !== node.compileRevision || state.address !== conditionAddressKey(node.conditionPath) || state[name].input !== node[name]) {
        state[name] = roleCompilationState(node[name], name === 'key' ? 'declaration-key' : 'declaration-content')
        changed = true
      }
    }
    state.version = node.compileRevision
    state.address = conditionAddressKey(node.conditionPath)
    if (changed) delete node.deferredReason
  }

  /** 按 Key→Content 访问同一声明；Key 撤销节点时不再访问 Content。 */
  private visitNode(node: JSSStyleNode, wave: number): void {
    delete node.deferredReason
    this.invalidate(node)
    const state = this.session.compilations.get(node) ?? {
      version: node.compileRevision,
      address: conditionAddressKey(node.conditionPath),
      key: roleCompilationState(node.key, 'declaration-key'),
      content: roleCompilationState(node.content, 'declaration-content'),
    }
    this.session.compilations.set(node, state)
    const activationPath = node.conditionPath
    for (const name of ['key', 'content'] as const) {
      if (!this.session.hasOutput(node)) return
      if (!state[name].complete) this.visitRole(node, name, state[name], wave, activationPath)
    }
  }

  /** 访问当前角色的实际输入，替代结果仍归原输入；暂缓后只重新尝试该角色回调。 */
  private visitRole(node: JSSStyleNode, name: 'key' | 'content', state: RoleCompilationState, wave: number, activationPath: ConditionPath): void {
    state.visitedContents.clear()
    const activatedContents = new Set<JSSContent>()
    const context: Omit<JSSCompileContext, 'input'> = {
      node,
      session: this.session.identity,
      conditionPath: conditionPathSnapshot(node.conditionPath),
      key: node.key,
      content: node.content,
      role: name === 'key' ? 'declaration-key' : 'declaration-content',
    }
    /** 为当前声明激活内容的按需 Rules，保留其条件地址与消费者关系。 */
    const activate = (content: JSSContent): void => {
      activatedContents.add(content)
      this.resources.activate(content, {
        root: this.sourceRules,
        conditionPath: conditionPathSnapshot(activationPath),
        key: node.key,
      }, node)
    }
    const complete = visitContent(context[name], context, this.controller, this.session, wave, state, this.budget, activate, this.tokens)
    state.complete = complete && node.deferredReason === undefined
    state.input = context[name]
    this.resources.updateConsumer(node, name, activatedContents, state.complete)
  }

  /**
   * 只核对尚待处理的位置；有新前提或未暂缓工作时继续，否则报告实际暂缓原因。
   */
  private isReady(): boolean {
    const pending = [...this.pending]
    const deferred = pending.find((node) => node.deferredReason !== undefined)
    if (deferred && !pending.some((node) => !this.session.compilations.has(node) || node.deferredReason === undefined)) throw deferred.deferredReason
    return pending.length === 0
  }
}

/** 为角色或激活回调隔离当前路径容器，保留 Condition 身份；每次调用都取得当时输入。 */
const conditionPathSnapshot = (path: ConditionPath): ConditionPath => ({
  targetConditionPath: [...path.targetConditionPath],
  stateConditionPath: [...path.stateConditionPath],
})
