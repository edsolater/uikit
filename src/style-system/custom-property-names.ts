/** Variable 与 Modification 共享的 CSS 自定义属性名称分配。 */
import { IdGenerator } from '@edsolater/fnkit'

/** Variable 与 Modification 共用的临时名称序号，仅在缺少名称时分配。 */
const nameGenerator = new IdGenerator('temp')
/** 已用于变量或变化声明的名称；自动分配避让显式名称，显式同名仍允许 CSS 局部覆盖。 */
const usedNames = new Set<string>()

/**
 * 分配同一 CSS 自定义属性命名空间中的名称；匿名名称避让已登记的显式名称。
 * 显式同名保留，用于 CSS 局部覆盖；返回名称保留调用者传入的 -- 前缀。
 */
export function allocateVariableName(name?: string): string {
  if (name === undefined) {
    do { name = `temp-${nameGenerator.genID()}` } while (usedNames.has(name))
  }
  usedNames.add(name.replace(/^--/, ''))
  return name
}
