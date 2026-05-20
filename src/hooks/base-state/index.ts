/**
 * State 状态模型统一出口。
 *
 * 业务代码只从这里导入 createState、$、derive 和相关类型。
 */

export { createState } from './createState'
export type { CreateStateOptions, StateMode } from './createState'
export { createDerived, derive, flip } from './deriveState'
export { $ } from './readState'
export type { MayState } from './readState'
export { isState, toState, type State } from './state'

