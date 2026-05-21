/**
 * State 快照工具。
 *
 * 这个文件只负责把包含 `State` 的树形输入读取成当前快照。
 * 它处理对象、数组和 tuple 的递归解包，但不负责 `MayState` 的最终消费边界。
 */
import { isObjectLiteral } from '@edsolater/fnkit'
import { isState, type State } from './state'

type SnapshotLeaf =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | null
  | undefined
  | Date
  | RegExp
  | Error
  | Map<any, any>
  | Set<any>
  | WeakMap<any, any>
  | WeakSet<any>
  | Promise<any>

/**
 * 深度解包树形值来源后的快照类型。
 */
export type Snapshot<T> =
  T extends State<infer Value>
    ? Snapshot<Value>
    : T extends SnapshotLeaf
      ? T
      : T extends (...args: any[]) => any
        ? T
        : T extends [...infer Items]
          ? { [Index in keyof Items]: Snapshot<Items[Index]> }
          : T extends (infer Item)[]
            ? Snapshot<Item>[]
            : T extends object
              ? { [Key in keyof T]: Snapshot<T[Key]> }
              : T

/**
 * 读取树形输入的当前快照。
 */
export function snapshot<T>(tree: T): Snapshot<T>
export function snapshot<T>(tree: T | undefined): Snapshot<T> | undefined
export function snapshot<T>(tree: T | undefined): Snapshot<T> | undefined {
  return readSnapshot(tree)
}

function readSnapshot<T>(input: T): Snapshot<T>
function readSnapshot<T>(input: T | undefined): Snapshot<T> | undefined
function readSnapshot<T>(input: T | undefined): Snapshot<T> | undefined {
  if (isState(input)) {
    return readSnapshot(input.read()) as Snapshot<T>
  }

  if (Array.isArray(input)) {
    return input.map((item) => readSnapshot(item)) as Snapshot<T>
  }

  if (isObjectLiteral(input)) {
    const snapshot: Record<string, unknown> = {}
    for (const key of Object.keys(input)) {
      snapshot[key] = readSnapshot((input as Record<string, unknown>)[key])
    }
    return snapshot as Snapshot<T>
  }

  return input as Snapshot<T> | undefined
}