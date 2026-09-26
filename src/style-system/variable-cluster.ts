/** 成员选择与默认 Variable 的同一入口。 */
import { connectVariable, type Variable } from './variable'
import type { ASTController } from './compiler/style-nodes-to-content-nodes'
import type { ValueInput } from './value'

const definitions = new WeakMap<object, Record<string, Variable>>()

/** 直接使用代表 default Variable；调用时按成员键取得原 Variable。 */
export type VariableCluster<Members extends { default: Variable }> = Variable & {
  <Name extends keyof Members>(name: Name): Members[Name]
}

/** 聚合带 default 的 Variable 成员；选择未声明成员时抛错。 */
export function variableCluster<Members extends { default: Variable } & Record<string | number, Variable>>(members: Members): VariableCluster<Members> {
  const select = (name: keyof Members) => {
    if (!Object.hasOwn(members, name)) throw new Error(`Variable Cluster 未定义成员：${String(name)}。`)
    return members[name]
  }
  let cluster: VariableCluster<Members>
  const parse = (controller: ASTController): ValueInput => {
    if (controller.role === 'declaration-key') {
      const sourceMembers = controller.content !== null && (typeof controller.content === 'object' || typeof controller.content === 'function')
        ? definitions.get(controller.content as object)
        : undefined
      if (sourceMembers) {
        for (const [member, source] of clusterDeclarations(cluster, controller.content) ?? []) {
          controller.insert(controller.conditionPath, member, source)
        }
        controller.remove()
        return undefined
      }
    }
    return members.default.parse(controller)
  }
  cluster = new Proxy(select, {
    get(target, property, receiver) {
      if (property === 'parse') return parse
      if (property === 'kind' || property === 'name' || property === 'onActive' || property === 'parseWaveIndex' || property === 'toCSSString') return Reflect.get(members.default, property)
      return Reflect.get(target, property, receiver)
    },
    has(target, property) { return property in members.default || property in target },
  }) as VariableCluster<Members>
  connectVariable(cluster, members.default)
  definitions.set(cluster, members)
  return cluster
}

/** 内部编译入口：配对双方已有同名成员；实际配对的目标或来源冲突时整组拒绝。 */
export function clusterDeclarations(target: unknown, source: unknown): [Variable, Variable][] | undefined {
  if (target === null || (typeof target !== 'object' && typeof target !== 'function')
    || source === null || (typeof source !== 'object' && typeof source !== 'function')) return undefined
  const targets = definitions.get(target)
  const sources = definitions.get(source)
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
