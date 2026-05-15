/**
 * State 状态模型统一出口。
 *
 * 业务代码只从这里导入 createState、$、derive 和相关类型。
 */

export { createState } from './createState'
export { $, derive } from './read'
export type { MayState } from './read'
export type {
  CreateStateOptions,
  SignalStateSetter,
  SignalState,
  StateMode,
  StoreStateSetter,
  StoreState,
  State,
} from './createState'