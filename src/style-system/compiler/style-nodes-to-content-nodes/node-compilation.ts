/** 本次内容编译的节点角色与访问进度。
 *
 * 推进 Key 与 Content，交付已完成声明及子内容的解析结果。
 *
 * 将跨波进度和内容链访问留在同一责任内，供编排统一推进。
 */
import { assert, hasProperty, isArray, isFunction, isObjectLike } from '@edsolater/fnkit'
import { outputConditionPath, type ConditionPath, type CSSConditionPath } from '../../condition'
import type { JSSKey } from '../../key'
import type { Rules } from '../../rule'
import { hasJSSContentOnCompileMethod, hasJSSContentOutput, type JSSCompileContext, type JSSContent } from '../../content'
import type { JSSStyleNode } from '../rules-to-style-nodes'
import type { ASTSession, ASTController } from '../ast-controller'
import type { ResourceCompilation } from './resource-compilation'

/** 一项已完成编译的声明；保留内容对象和子内容的编译结果供输出阶段读取。 */
export interface JSSContentNode {
  conditionPath: CSSConditionPath
  key: JSSKey | undefined
  content: unknown
  resolvedContents: WeakMap<object, unknown>
}

/** 一个声明角色的输入快照、访问进度与完成状态；仅 Content 记录输出替代。 */
interface RoleCompilationState {
  input: unknown
  progress: WeakMap<object, ContentVisitResult>
  replacements: WeakMap<object, unknown> | undefined
  complete: boolean
}

/** 节点的两角色与共同 revision；角色失效只由节点编译维护。 */
interface StyleNodeCompileState {
  version: number
  key: RoleCompilationState
  content: RoleCompilationState
}

/** 为当前输入建立未访问的角色；不含编译行为的 Key 可直接参与输出。 */
function roleCompilationState(input: unknown, role: JSSCompileContext['role']): RoleCompilationState {
  return {
    input,
    progress: new WeakMap(),
    replacements: role === 'declaration-content' ? new WeakMap() : undefined,
    complete: role === 'declaration-key' && !hasJSSContentOnCompileMethod(input),
  }
}

/** 内容访问的返回值与完成度；回调已调用后保留此进度，后续波继续访问未完成的替代链。 */
interface ContentVisitResult {
  content: unknown
  complete: boolean
}

/** 本次编译允许调用 onCompile 的总次数。 */
interface CompileBudget {
  operations: number
  maximumOperations: number
}

/** 在一次角色访问中推进内容链，交付内容及完成度；子步骤共用当次回调输入与递归约束。 */
function visitContent(
  input: unknown,
  context: JSSCompileContext,
  controller: ASTController,
  wave: number,
  state: RoleCompilationState,
  budget: CompileBudget,
  activate: (content: JSSContent) => void,
): ContentVisitResult {
  const activeObjects = new Set<object>()
  return visit(input)

  /** 在当前编译波访问 Key 或 Content 链，交回当前位置的内容及是否仍需后续波。 */
  function visit(input: unknown, depth = 0): ContentVisitResult {
    assert(depth <= 256, 'Content 编译嵌套超过上限 256，编译无法终止。')
    if (input === undefined || typeof input === 'string' || typeof input === 'number') return { content: input, complete: true }
    assert(isObjectLike(input), '无效的 CSS 内容。')
    assert(!activeObjects.has(input), 'CSS 内容存在循环引用，无法生成 CSS。')
    activeObjects.add(input)
    try {
      if (hasProperty(input, 'onActive', isFunction)) activate(input)

      const result = hasJSSContentOnCompileMethod(input)
        ? compile(input, depth)
        : visitChildren(input, depth)
      if (result.complete && result.content !== input) state.replacements?.set(input, result.content)
      return result
    } finally {
      activeObjects.delete(input)
    }
  }

  /** 执行当前对象的一次编译并延续替代链；跨波复用进度，完成结果仍绑定原对象。 */
  function compile(input: JSSContent & Required<Pick<JSSContent, 'onCompile'>>, depth: number): ContentVisitResult {
    let previous = state.progress.get(input)
    const earliestWave = input.compileWaveIndex ?? 0
    assert(Number.isInteger(earliestWave) && earliestWave >= 0, 'compileWaveIndex 必须是非负整数。')
    if (!previous && earliestWave > wave) {
      visitChildren(input, depth)
      return { content: input, complete: false }
    }
    if (!previous) {
      budget.operations++
      assert(budget.operations <= budget.maximumOperations, `AST 编译操作超过上限 ${budget.maximumOperations}，编译无法终止。`)
      previous = { content: input.onCompile(context, controller), complete: false }
      state.progress.set(input, previous)
    }
    const result = previous.content === input
      ? visitChildren(input, depth)
      : visit(previous.content, depth + 1)
    state.progress.set(input, result)
    return result
  }

  /** 访问依赖并判断当前输出；无输出对象等待依赖完成后才从内容链消失。 */
  function visitChildren(input: object, depth: number): ContentVisitResult {
    const dependencyValue = 'dependencies' in input ? input.dependencies : undefined
    const dependencies = isArray(dependencyValue) ? dependencyValue : undefined
    let complete = true
    for (const child of dependencies ?? []) {
      const result = visit(child, depth + 1)
      complete &&= result.complete
    }

    if (hasJSSContentOutput(input)) return { content: input, complete }
    if (hasJSSContentOnCompileMethod(input)) return { content: input, complete }
    if (dependencies || hasProperty(input, 'onActive', isFunction)) {
      return { content: complete ? undefined : input, complete }
    }
    throw new Error('无效的 CSS 内容。')
  }
}

/** 本次编译的节点角色进度；逐波访问、输入失效与当前队列的完成判断由此统一负责。 */
export class NodeCompilation {
  private states = new WeakMap<JSSStyleNode, StyleNodeCompileState>()
  private budget: CompileBudget = { operations: 0, maximumOperations: 100_000 }

  /** 绑定当前队列、规则快照与资源激活能力，进度不跨编译共享。 */
  constructor(private session: ASTSession, private controller: ASTController, private sourceRules: Rules, private resources: ResourceCompilation) {}

  /** 按波初顺序访问当前仍参与输出的节点，新增节点留给下一波。 */
  visit(compileWaveIndex: number): void {
    for (const node of this.session.nodes.slice()) {
      if (this.session.hasOutput(node)) this.visitNode(node, compileWaveIndex)
    }
  }

  /** 波末核对当前输入；全部角色完成时返回 true，否则继续后续波；暂缓无推进来源时抛出实际原因。 */
  settle(): boolean {
    for (const node of this.session.nodes) this.invalidate(node)
    return this.isReady()
  }

  /** 取得原贡献在自身位置的解析结果，供稳定聚合惰性读取。 */
  resolvedContents(node: JSSStyleNode): WeakMap<object, unknown> {
    return this.states.get(node)!.content.replacements!
  }

  /** 将已完成且被选择的当前位置交付输出，不泄漏角色访问账本。 */
  outputs(select: (node: JSSStyleNode) => boolean): JSSContentNode[] {
    return this.session.nodes.flatMap((node) => {
      const state = this.states.get(node)
      if (!select(node) || !state?.key.complete || !state.content.complete) return []
      return [{ conditionPath: outputConditionPath(node.conditionPath), key: node.key, content: node.content, resolvedContents: state.content.replacements! }]
    })
  }

  /** Key／Content／revision 改变时重建对应角色；访问前与波末调用同一规则。 */
  private invalidate(node: JSSStyleNode): void {
    const state = this.states.get(node)
    if (!state) return
    let changed = false
    for (const name of ['key', 'content'] as const) {
      if (state.version !== node.compileRevision || state[name].input !== node[name]) {
        state[name] = roleCompilationState(node[name], name === 'key' ? 'declaration-key' : 'declaration-content')
        changed = true
      }
    }
    state.version = node.compileRevision
    if (changed) delete node.deferredReason
  }

  /** 按 Key→Content 访问同一声明；Key 撤销节点时不再访问 Content。 */
  private visitNode(node: JSSStyleNode, wave: number): void {
    delete node.deferredReason
    this.invalidate(node)
    const state = this.states.get(node) ?? {
      version: node.compileRevision,
      key: roleCompilationState(node.key, 'declaration-key'),
      content: roleCompilationState(node.content, 'declaration-content'),
    }
    this.states.set(node, state)
    const activationPath = node.conditionPath
    for (const name of ['key', 'content'] as const) {
      if (!this.session.hasOutput(node)) return
      if (!state[name].complete) this.visitRole(node, name, state[name], wave, activationPath)
    }
  }

  /** 访问当前角色的实际输入，替代结果仍归原输入；暂缓后只重新尝试该角色回调。 */
  private visitRole(node: JSSStyleNode, name: 'key' | 'content', state: RoleCompilationState, wave: number, activationPath: ConditionPath): void {
    const context: JSSCompileContext = {
      node,
      session: this.session.identity,
      conditionPath: conditionPathSnapshot(node.conditionPath),
      key: node.key,
      content: node.content,
      role: name === 'key' ? 'declaration-key' : 'declaration-content',
      readState: name === 'content' ? node.readState : undefined,
    }
    /** 为当前声明激活内容的按需 Rules，保留其条件地址与消费者关系。 */
    const activate = (content: JSSContent): void => this.resources.activate(content, {
      root: this.sourceRules,
      conditionPath: conditionPathSnapshot(activationPath),
      key: node.key,
    }, node)
    const result = visitContent(context[name], context, this.controller, wave, state, this.budget, activate)
    state.complete = result.complete && node.deferredReason === undefined
    state.input = context[name]
    if (node.deferredReason !== undefined) state.progress = new WeakMap()
  }

  /** 只看本波结束的现存队列：新节点或未暂缓的未完成角色可进入下一波，否则报告实际暂缓原因。 */
  private isReady(): boolean {
    const pending = this.session.nodes.filter((node) => {
      const state = this.states.get(node)
      return !state?.key.complete || !state.content.complete
    })
    const deferred = this.session.nodes.find((node) => node.deferredReason !== undefined)
    if (deferred && !pending.some((node) => !this.states.has(node) || node.deferredReason === undefined)) throw deferred.deferredReason
    return pending.length === 0
  }
}

/** 为角色或激活回调隔离当前路径容器，保留 Condition 身份；每次调用都取得当时输入。 */
function conditionPathSnapshot(path: ConditionPath): ConditionPath {
  return {
    semanticPath: path.semanticPath?.slice(),
    targetConditionPath: [...path.targetConditionPath],
    stateConditionPath: [...path.stateConditionPath],
  }
}
