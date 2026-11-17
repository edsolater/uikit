/** State 的内部来源读取接线，不进入公开状态接口或包根出口。 */
import type { State } from './state'

export const stateSourceAccessor = Symbol('StateSourceAccessor')

/** createState在实例上保存原来源accessor，不另存一份来源值。 */
export interface StateSourceAccess {
  [stateSourceAccessor](): unknown
}

/** 仅供创建该State的设施区分原始声明与完成值，不触发结果层求值。 */
export function readStateSource(state: State): unknown {
  return (state as State & StateSourceAccess)[stateSourceAccessor]()
}
