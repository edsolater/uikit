import type { Collection } from '@edsolater/fnkit'

/**
 * TODO: 数据的集合, Array 或 Object 等等, 都可以用这个 hook 来创建一个集合状态。还没想清楚, 这好像又是create store state的本身
 * 它是为了管理数据集合方便，
 * 
 * observer 模式：除非用函数消费，否则返回一个accessor 对象
 *
 */
export function createCollection<InitialCollection extends Collection>(initial: InitialCollection) {
  throw new Error('to impliment')
}
