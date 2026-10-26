/** 样式编译的节点、查询与内容访问协议；运行会话由编译实现持有。 */
import type { ContentView } from '../content'
import type { ConditionPath, CSSConditionPath } from '../condition'
import type { JSSKey } from '../key'
import type { JSSCompileContext } from '../content'

/** 一处内容的通知进度与当前输出；编译与输出共同读取，不复制最终结果。 */
export interface ContentCompilationRecord {
  content: unknown
  notified: boolean
  /** 当前位置、当前访问阶段的依赖；分析与输出共用这份事实。 */
  dependencies?: unknown[]
  /** 仅当前同步通知期间允许操作此记录，阻止旧上下文写入后来的记录。 */
  notifyingContext?: JSSCompileContext
}

/** 查询字段取交集；未指定的字段不限制结果。 */
export interface ASTQuery {
  key?: JSSKey
  conditionPath?: ConditionPath
  productTag?: object
  resourceAddress?: string
}
/** 锚点与方向是互斥选择。 */
export type ASTPosition = { before: JSSStyleNode; after?: never } | { after: JSSStyleNode; before?: never }

/** 查询和改写本次编译的样式节点。 */
export interface ASTController {
  /** 改写本次对象通知的共享替代结果；不直接改写声明。显式 undefined 抑制该对象输出。 */
  setContent(context: JSSCompileContext, content: unknown): void
  /** 读取当前声明中内容的已编译替代结果；未访问内容保持原输入。 */
  getCompiledContent(node: JSSStyleNode, input: unknown): unknown
  /** 为同一位置的自动输出复用已编译内容，避免再次执行配方。 */
  getCompiledContentView(node: JSSStyleNode, input: unknown): ContentView
  /** 读取位置记录中的替代与实际依赖，不再触发业务 getter。 */
  getContentCompilation(node: JSSStyleNode, input: unknown): ContentCompilationRecord | undefined
  /** 当前输入实际访问过此内容；历史替代记录不代表仍在消费。 */
  usesContent(node: JSSStyleNode, input: unknown): boolean
  /** 当前输出队列的有序查询，没有副作用；Key 按属性名、条件路径按输出地址匹配。 */
  search(query: ASTQuery): JSSStyleNode[]
  /** 按同一查询语义判断是否存在节点。 */
  has(query: ASTQuery): boolean
  /** 在指定地址选有效声明；根地址别名仍遵循原生CSS特异度。 */
  findDeclaration(query: ASTQuery & { key: JSSKey; conditionPath: ConditionPath }, accept: (node: JSSStyleNode) => boolean): JSSStyleNode | undefined
  /** 内部逃生舱：取得输出队列快照；常规查询使用 search。 */
  nodes(): JSSStyleNode[]
  /** 订阅本次输出节点的加入、输入改写和退出；登记时按当前顺序交付已有节点。 */
  observeNodes(observe: (node: JSSStyleNode, present: boolean) => void): void
  /** 比较现存输出节点的书写顺序，不重新搜索队列。 */
  compareOrder(left: JSSStyleNode, right: JSSStyleNode): number
  /** 位置、声明和来源分别传入；插入点紧邻锚点，不隐含当前编译位置。 */
  insert(position: { conditionPath: ConditionPath } & ASTPosition, declaration: [key: JSSKey | undefined, content: unknown], provenance: {
    owner: JSSStyleNode
    identity?: string
    productTag?: object
    resourceAddress?: string
    /** 发布前补齐领域归属；观察者只接收已经初始化的节点。 */
    initialize?: (node: JSSStyleNode) => void
  }): JSSStyleNode
  /** 移到紧邻锚点的位置，不改变地址或来源。 */
  move(node: JSSStyleNode, position: ASTPosition): void
  /** 默认撤销及级联清理；from: output 仅退出输出，保留来源且不触发撤销清理。 */
  remove(node: JSSStyleNode, options?: { from: 'output' }): void
  /** 显式来源节点依赖此产物；全部依赖者撤销后，非源产物才随之撤销。 */
  depend(node: JSSStyleNode, options: { owner: JSSStyleNode }): void
  /** 解除指定来源的一条依赖；共享产物保留到最后一个来源退出。 */
  release(node: JSSStyleNode, options: { owner: JSSStyleNode }): void
  /** 注册节点撤销时执行的清理；只退出输出不触发。 */
  onRemove(node: JSSStyleNode, cleanup: () => void): void
  /** 暂缓当前通知，等待后续波重试；不撤回已经执行的内容和队列操作，无进展时报告此原因。 */
  defer(node: JSSStyleNode, message: string): void
  /** 登记队列稳定后的核对；改变队列时返回 true，继续普通编译波。 */
  addSettlementCheck(check: () => boolean): void
}

/** 队列中一项可改写的样式内容；地址保留目标与状态，位置决定输出顺序。 */
export interface JSSStyleNode {
  /** 同址聚合结果不是新的业务声明来源。 */
  aggregate?: boolean
  /** 编译会话中的稳定位置身份。 */
  identity?: string
  /** 内容身份未变但编译前提改变时递增，使旧结果失效。 */
  compileRevision: number
  /** 当前尝试无法继续的原因；下次尝试前清除。 */
  deferredReason?: Error
  conditionPath: ConditionPath
  key: JSSKey | undefined
  content: unknown
  /** 按需产生的资源用此身份替换同址旧资源；源规则不带此字段。 */
  resourceAddress?: string
  /** 生成产物的可选查询标识；不参与节点来源与资源替换。 */
  productTag?: object
}

/** 一项已完成编译的声明；保留内容对象和子内容的编译结果供输出阶段读取。 */
export interface JSSContentNode {
  conditionPath: CSSConditionPath
  key: JSSKey | undefined
  content: unknown
  compiledContents: WeakMap<object, ContentCompilationRecord>
}
