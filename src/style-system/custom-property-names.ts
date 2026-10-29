/** 为 Token 与 Modification 的自动实体标识分配唯一名称。 */
import { IdGenerator } from '@edsolater/fnkit'

const nameGenerator = new IdGenerator('temp')

/**
 * 分配自动实体标识，可在结果前附加名称前缀。
 */
export function allocateVariableName({
  prefixName,
}: { prefixName?: string } = {}): string {
  const entity = nameGenerator.genID()
  return prefixName === undefined ? entity : `${prefixName}-${entity}`
}
