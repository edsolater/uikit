/**
 * State 状态模型统一出口。
 *
 * 这个文件处在 base-state 的对外汇总阶段，业务代码只从这里导入 createState、$、derive 和相关类型。
 *
 * 它负责：
 * - 汇总 base-state 的稳定公开入口。
 *
 * 它不负责：
 * - 承载任何状态实现细节。
 * - 解释 signal/store 的底层行为。
 */

export { createState } from './createState'
export type { CreateStateOptions, StateMode } from './createState'
export { createDerived, derive, flip } from './state/derive'
export { $ } from './state/read'
export type { MayState } from './state/read'
export { isState, toState, type State } from './state/state'

