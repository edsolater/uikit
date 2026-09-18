/** 将 Rules 挂载为有序 CSS 记录，再生成 CSS string。 */
import type { ConditionPath } from '../core/css-condition'
import { isCSSPair } from '../core/css-declaration'
import { declarationSyntax, propertyName, type CSSKey } from '../core/css-key'
import type { Rules, RuleValue } from '../core/css-rule'
import type { Value, ValueInput } from '../core/css-value'
import { isVariable, type VariableInput } from '../core/css-variable'
import { compileDeclaration, compileVariableDeclaration, expandProperty } from './compile-declaration'
import { compileValue, valueConditionPath, type ValueContext, type ValueConditions } from './compile-value'
import { hasConditionPrefix, mountCSSRecord, type CSSRecord } from './css-records'

/** 解析全部候选与依赖，挂载为深度优先记录数组。 */
export function resolveRules(source: Rules): CSSRecord[] {
  const records: CSSRecord[] = []
  const pending = new Set<Rules>([source])
  const activated = new Set<Value>()
  const visitingRules = new Set<Rules>()
  const resolving = new Set<object>()
  const defaults = new Set<string>()
  const definitionOwners = new Map<string, Rules>()
  let compilingSource = source

  /** 挂载有效声明；显式值优先，具名定义按 owner 整体替换。 */
  const write = (path: ConditionPath, key: string | undefined, css: string, conditions: ValueConditions, owner = compilingSource, isDefault = false): void => {
    const headers = [...path, ...valueConditionPath(conditions)].map((item) => item.header)
    const record: CSSRecord = [headers, key, css]
    const address = JSON.stringify([headers, key])
    const definitionIndex = headers.findIndex((header) => header !== undefined && /^@(function|keyframes|property)\s/.test(header))
    let replacementIndex: number | undefined

    if (definitionIndex !== -1) {
      const prefix = headers.slice(0, definitionIndex + 1)
      const definitionAddress = JSON.stringify(prefix)
      if (definitionOwners.has(definitionAddress) && definitionOwners.get(definitionAddress) !== owner) {
        const start = records.findIndex(([path]) => hasConditionPrefix(path, prefix))
        if (start !== -1) {
          let end = start
          while (end < records.length && hasConditionPrefix(records[end][0], prefix)) {
            defaults.delete(JSON.stringify([records[end][0], records[end][1]]))
            end++
          }
          records.splice(start, end - start)
          replacementIndex = start
        }
      }
      definitionOwners.set(definitionAddress, owner)
    }

    const existing = records.findIndex(([path, property]) => property === key && JSON.stringify(path) === JSON.stringify(headers))
    if (isDefault && existing !== -1 && !defaults.has(address)) return
    if (replacementIndex === undefined) mountCSSRecord(records, record)
    else records.splice(replacementIndex, 0, record)
    if (isDefault) defaults.add(address)
    else defaults.delete(address)
  }

  /** 解读当前 Rule 地址的声明与候选；递归 Rules 报错。 */
  const visit = (input: RuleValue, path: ConditionPath, key?: CSSKey, definitionOwner?: Rules, conditions: ValueConditions = []): void => {
    const context: ValueContext = {
      root: source, path, key, conditions, resolving,
      /** 在当前消费位置挂载变量的条件默认值。 */
      defineVariable(name, values, location) {
        for (const value of values) write(location.path, `--${name}`, value.text, value.conditions, definitionOwner, true)
      },
      /** 完整 Rules 沿用外层地址与候选条件。 */
      visitRules(rules, contributions) { visit(rules, path, key, definitionOwner, contributions) },
      /** 首次解析访问时激活依赖。 */
      activate(value, location = { root: source, path, key }) {
        if (typeof value !== 'object' || activated.has(value)) return
        activated.add(value)
        const dependencies = value.onActive?.({ root: source, path: location.path, key: location.key })
        if (dependencies) for (const dependency of dependencies instanceof Map ? [dependencies] : dependencies) pending.add(dependency)
      },
    }
    if (key !== undefined && typeof key === 'object' && 'kind' in key) context.activate(key)
    if (input instanceof Map) {
      if (visitingRules.has(input)) throw new Error('Rules 内容存在递归引用，无法生成 CSS。')
      visitingRules.add(input)
      try {
        for (const [[relativePath, nextProperty], child] of input) {
          const owner = relativePath?.some((item) => /^@(function|keyframes|property)\s/.test(item.header)) ? input : definitionOwner
          visit(child, [...path, ...(relativePath ?? [])], nextProperty ?? key, owner, conditions)
        }
      } finally { visitingRules.delete(input) }
      return
    }
    if (isVariable(key) && !isCSSPair(input)) {
      for (const result of compileVariableDeclaration(key, input as VariableInput, context)) write(path, result.property, result.text, result.conditions, definitionOwner)
      return
    }
    if (isCSSPair(input)) {
      const [declarationKey, content] = input
      if (content === undefined) return
      if (typeof declarationKey === 'object' && 'kind' in declarationKey) context.activate(declarationKey)
      const syntax = declarationSyntax(declarationKey)
      if ((syntax === 'value' && !isVariable(declarationKey)) || content instanceof Map) {
        visit(content as ValueInput, path, declarationKey, definitionOwner, conditions)
        return
      }
      for (const result of compileDeclaration(input, { ...context, key: declarationKey })) write(path, result.property, result.text, result.conditions, definitionOwner)
      return
    }
    for (const result of compileValue(input, context)) {
      if (key === undefined) write(path, undefined, result.text, result.conditions, definitionOwner)
      else for (const declaration of expandProperty(propertyName(key), result)) write(path, declaration.property, declaration.text, declaration.conditions, definitionOwner)
    }
  }
  for (const rules of pending) {
    compilingSource = rules
    visit(rules, [])
  }
  return records
}

/** 线性输出完整记录数组；只按相邻地址打开和关闭 CSS 块。 */
export function stringifyCSS(records: CSSRecord[]): string {
  let previous: string[] = []
  const css: string[] = []
  for (const [conditions, key, text] of records) {
    const path = conditions.filter((header) => header !== undefined)
    let shared = 0
    while (shared < previous.length && shared < path.length && previous[shared] === path[shared]) shared++
    for (let index = previous.length; index > shared; index--) css.push('}')
    for (const header of path.slice(shared)) css.push(`${header} {`)
    css.push(key === undefined ? text : `${key}: ${text};`)
    previous = path
  }
  for (let index = previous.length; index > 0; index--) css.push('}')
  return css.join('\n')
}

/** 编译 Rules 快照为 CSS string，失败时不返回部分结果。 */
export function compileRules(source: Rules): string {
  return stringifyCSS(resolveRules(source))
}
