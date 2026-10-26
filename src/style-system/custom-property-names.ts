/** Token 与 Modification 共享的 CSS 自定义属性名称分配。 */
import { IdGenerator } from '@edsolater/fnkit'

/** Token 与 Modification 共用的临时名称序号，仅在缺少名称时分配。 */
const nameGenerator = new IdGenerator('temp')
/** 同一命名空间内的占用来源；显式同名仍允许 CSS 局部覆盖。 */
const usedNames = new Map<string, 'explicit' | 'automatic'>()

/**
 * 分配同一 CSS 自定义属性命名空间中的名称；匿名名称避让已登记的显式名称。
 * 显式同名保留，用于 CSS 局部覆盖；返回名称保留调用者传入的 -- 前缀。
 * 自动名称可提交旧候选复用；旧候选后来被显式占用时重新分配。
 */
export function allocateVariableName(name?: string, previous?: string): string {
  if (name === undefined) {
    if (previous !== undefined && usedNames.get(previous.replace(/^--/, '')) === 'automatic') return previous
    do { name = `temp-${nameGenerator.genID()}` } while (usedNames.has(name))
    usedNames.set(name, 'automatic')
  } else {
    usedNames.set(name.replace(/^--/, ''), 'explicit')
  }
  return name
}
