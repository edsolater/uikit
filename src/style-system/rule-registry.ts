/** 单一源 Rules 账本与登记句柄，不负责编译或 DOM 提交。 */
import { assert } from '@edsolater/fnkit'
import type { Rule, RuleHandle, Rules } from './rule'

export const registeredRules: Rules = []

/**
 * 按顺序登记；句柄只控制自己的声明，覆盖交给 CSS。
 */
export function registerRule(entry: Rule): RuleHandle {
  registeredRules.push(entry)
  return {
    /**
     * 删除本次登记。
     */
    remove: () => {
      const index = registeredRules.indexOf(entry)
      if (index !== -1) registeredRules.splice(index, 1)
    },
    /**
     * 更新本次登记；删除后报错。
     */
    replace: (value) => {
      assert(registeredRules.includes(entry), '当前句柄已删除。')
      entry[2] = value
    },
  }
}
