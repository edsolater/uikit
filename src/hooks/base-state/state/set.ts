/**
 * State 写入协议入口。
 *
 * 这个文件处在 base-state 的写入协议阶段，
 * 负责定义“目标状态如何接收新的输入来源”这一层公共心智。
 *
 * 它负责：
 * - 定义 set 输入协议。
 * - 区分一次性快照输入与活水源输入。
 * - 预留未来统一的连接、替换、断开与清理语义。
 *
 * 它不负责：
 * - 创建 signal/store 容器。
 * - 实现 store 的路径写入。
 * - 实现 signal 的具体 setValue 调用。
 * - 在当前阶段接入任何现有运行流程。
 *
 * 相邻分工：
 * - state.ts 负责 State 协议本身。
 * - read.ts 负责读取当前值。
 * - createSignalState.ts / createStoreState.ts 负责各自底层容器。
 */
import type { MayState } from './read'
import type { State } from './state'

/**
 * set 的基础输入协议。
 *
 * 这里先只定义“外部可以传什么”，当前还不承接运行时接线。
 */
export type BasicStateSetter<T> = MayState<T> | ((previous: T) => MayState<T>)

