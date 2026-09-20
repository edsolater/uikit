/** 成员选择与默认 Variable 的同一入口。 */
import { connectVariable, type Variable } from './css-variable'

/** 直接使用代表 default Variable；调用时按成员键取得原 Variable。 */
export type VariableCluster<Members extends { default: Variable }> = Variable & {
  <Name extends keyof Members | (Extract<keyof Members, number> extends never ? never : number)>(name: Name): Name extends keyof Members ? Members[Name] : Variable
}

/** 聚合带 default 的 Variable 成员；选择未声明成员时抛错。 */
export function variableCluster<Members extends { default: Variable } & Record<string | number, Variable>>(members: Members): VariableCluster<Members> {
  const select = (name: keyof Members) => {
    if (!Object.hasOwn(members, name)) throw new Error(`Variable Cluster 未定义成员：${String(name)}。`)
    return members[name]
  }
  const cluster = new Proxy(select, {
    get(target, property, receiver) {
      if (property === 'kind' || property === 'name' || property === 'onActive') return Reflect.get(members.default, property)
      return Reflect.get(target, property, receiver)
    },
    has(target, property) { return property in members.default || property in target },
  }) as VariableCluster<Members>
  connectVariable(cluster, members.default)
  return cluster
}
