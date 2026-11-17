/**
 * 将 is 中已经构建的能力逐项展开为声明。
 *
 * 认领属于本次解析，不写入可复用 Plugin；这里只读取声明，不执行业务 core。
 */
import type { MayArray } from '@edsolater/fnkit'
import {
  readPlugin,
  type PluginInput,
} from '../../plugins/tools/createInactivePlugin'

/**
 * 当前层接入每个条目的声明；后续字段消费与条目认领分别进行。
 */
export function collectPluginDeclarations(
  input: MayArray<PluginInput> | undefined,
): object[] {
  if (input === undefined) return []
  return Array.isArray(input) ? input.map(readPlugin) : [readPlugin(input)]
}
