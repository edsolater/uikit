/** 将成员选择与默认 Variable 操作合并为一个入口。 */
import { variable, type Variable, type VariableOptions } from './variable'
import type { ASTController } from './compiler/ast-controller'
import type { ValueInput } from './value'

const membersByCluster = new WeakMap<object, Record<string, Variable>>()

/** 作为 Variable 使用时代理 default 成员；调用时返回指定成员。 */
export type VariableCluster<Members extends { default: Variable }> = Variable & {
  <Name extends keyof Members>(name: Name): Members[Name]
}

/** 聚合带 default 的 Variable 成员；调用时选择成员，未知名称报错。 */
export function variableCluster<Members extends { default: Variable } & Record<string | number, Variable>>(members: Members): VariableCluster<Members> {
  /** 按成员键返回原 Variable，未知键报错。 */
  const select = (name: keyof Members) => {
    if (!Object.hasOwn(members, name)) throw new Error(`Variable Cluster 未定义成员：${String(name)}。`)
    return members[name]
  }
  let cluster: VariableCluster<Members>
  /** 配对 Cluster 声明，其他引用代理 default 成员解析。 */
  const parse = (controller: ASTController): ValueInput => {
    if (controller.role === 'declaration-key') {
      const sourceMembers = controller.content !== null && (typeof controller.content === 'object' || typeof controller.content === 'function')
        ? membersByCluster.get(controller.content as object)
        : undefined
      if (sourceMembers) {
        for (const [member, source] of clusterDeclarations(cluster, controller.content) ?? []) {
          controller.insert(controller.conditionPath, member, source)
        }
        controller.detach()
        return undefined
      }
    }
    return members.default.parse(controller)
  }
  cluster = new Proxy(select, {
    get(target, property, receiver) {
      if (property === 'parse') return parse
      if (property in members.default) return Reflect.get(members.default, property)
      return Reflect.get(target, property, receiver)
    },
    has(target, property) { return property in members.default || property in target },
  }) as VariableCluster<Members>
  membersByCluster.set(cluster, members)
  return cluster
}

/**
 * 沿来源 Cluster 创建成员集合。
 * @param changes
 * - 省略成员：沿用来源对象。
 * - 配置对象：按同名来源创建成员，当前 states 覆盖来源状态。
 * - Variable：整体替换已有成员，或加入新成员。
 */
export function clusterFrom<
  SourceMembers extends { default: Variable } & Record<string, Variable>,
  Changes extends Record<string, Variable | VariableOptions<Variable, any>>,
>(source: VariableCluster<SourceMembers>, changes: Changes): VariableCluster<
  Omit<SourceMembers, keyof Changes> & { [Name in keyof Changes]: Changes[Name] extends Variable ? Changes[Name] : Variable } & { default: Variable }
> {
  const sourceMembers = membersByCluster.get(source)
  if (!sourceMembers) throw new Error('clusterFrom 需要 Variable Cluster 来源。')
  const members: Record<string, Variable> = { ...sourceMembers }
  for (const [name, change] of Object.entries(changes)) {
    if ('kind' in change && change.kind === 'variable') {
      members[name] = change
      continue
    }
    const options = change as VariableOptions<Variable, any>
    const sourceMember = sourceMembers[name]
    if (!sourceMember) throw new Error(`Variable Cluster 未定义来源成员：${name}。新增成员须提供 Variable。`)
    const sourceStates = Object.fromEntries(
      [...sourceMember.config.states.keys()].map((state) => [state, sourceMember]),
    )
    members[name] = variable(sourceMember, { ...options, states: { ...sourceStates, ...options.states } })
  }
  return variableCluster(members as Omit<SourceMembers, keyof Changes> &
    { [Name in keyof Changes]: Changes[Name] extends Variable ? Changes[Name] : Variable } & { default: Variable })
}

/** 按成员名配对两个 Cluster；同名目标对应不同对象或来源时拒绝整组。 */
export function clusterDeclarations(target: unknown, source: unknown): [Variable, Variable][] | undefined {
  if (target === null || (typeof target !== 'object' && typeof target !== 'function')
    || source === null || (typeof source !== 'object' && typeof source !== 'function')) return undefined
  const targets = membersByCluster.get(target)
  const sources = membersByCluster.get(source)
  if (!targets || !sources) return undefined
  const declarations = new Map<string, [Variable, Variable]>()
  for (const [name, member] of Object.entries(targets)) {
    if (!Object.hasOwn(sources, name)) continue
    const content = sources[name]
    const existing = declarations.get(member.name)
    if (existing && (existing[0] !== member || existing[1] !== content)) {
      throw new Error(`Variable Cluster ${targets.default.name} ← ${sources.default.name} 的同名目标存在对象或来源冲突：${name}（--${member.name}）。`)
    }
    if (member !== content && member.name === content.name) {
      throw new Error(`Variable Cluster ${targets.default.name} ← ${sources.default.name} 的成员 ${name} 使用不同对象引用同名变量 --${member.name}。`)
    }
    declarations.set(member.name, [member, content])
  }
  return [...declarations.values()].filter(([member, content]) => member !== content)
}
