/** 解析规则与依赖，输出 CSS。 */
import type { ConditionPath } from '../core/css-condition'
import { propertyName, type CSSKey } from '../core/css-key'
import type { Rule, Rules } from '../core/css-rule'
import type { Valuable, CompileContext } from '../core/css-valuable'
import type { ValueInput } from '../core/css-value'
import { isVariable, type VariableInput } from '../core/css-variable'
import { compileVariableDeclaration } from './compile-variable'
import { compileValue, valueConditionPath, type ValueContext } from './compile-value'
import type { CSSRecord } from './css-records'

/** 解析源规则及按需依赖，得到有序 CSS 记录。 */
export function resolveRules(source: Rules): CSSRecord[] {
  const sourceOutput: { records: CSSRecord[]; defaults: CSSRecord[] } = { records: [], defaults: [] }
  const definitions = new Map<string, typeof sourceOutput>()
  const pending = new Map<string, Rule>()
  const activated = new Set<Valuable>()
  const visiting = new Set<Rules>()
  const resolving = new Set<object>()

  /** 激活依赖；同址完整定义采用后一次提供的内容。 */
  const activate = (value: Valuable, location: CompileContext): void => {
    if (activated.has(value)) return
    activated.add(value)
    const dependency = value.onActive?.(location)
    if (dependency) {
      for (const entry of dependency) {
        const [path, key] = entry
        const address = JSON.stringify([path, key === undefined ? undefined : propertyName(key)])
        pending.set(address, entry)
      }
    }
  }

  /** 编译结构嵌套；值分支不进入此路径。 */
  const visit = (rules: Rules, output: typeof sourceOutput, outer: ConditionPath = [], target?: CSSKey, inherited: string[] = []): void => {
    if (visiting.has(rules)) throw new Error('Rules 内容存在递归引用，无法生成 CSS。')
    visiting.add(rules)
    try {
      for (const [relative, ownKey, input] of rules) {
        const path = [...outer]
        const subjects = [...inherited]
        for (const item of relative ?? []) {
          if (typeof item === 'string') subjects.push(item)
          else path.push(item)
        }
        const key = ownKey ?? target
        if (Array.isArray(input) && input.every((entry) => Array.isArray(entry) && entry.length === 3)) {
          visit(input as Rules, output, path, key, subjects)
          continue
        }
        if (Array.isArray(input) && !isVariable(key)) throw new Error('嵌套 Rules 必须由路径、Key、内容三项组成。')
        const context: ValueContext = {
          root: source, path, key, resolving, conditions: subjects,
          /** 按首次使用激活依赖。 */
          activate: (value, location = { root: source, path, key }) => activate(value, location),
          /** 补充变量缺省赋值；显式同址声明优先。 */
          defineVariable(name, values, location) {
            for (const result of values) {
              const headers = [...location.path, ...valueConditionPath([...subjects, ...result.conditions])].map((item) => item.header)
              if (!output.defaults.some(([existing, property]) => property === `--${name}` && JSON.stringify(existing) === JSON.stringify(headers))) {
                output.defaults.push([headers, `--${name}`, result.text])
              }
            }
          },
        }
        if (isVariable(key)) context.activate(key)
        const values = isVariable(key)
          ? compileVariableDeclaration(input as VariableInput, context)
          : compileValue(input as ValueInput, context)
        const property = key === undefined ? undefined : propertyName(key)
        for (const result of values) {
          output.records.push([[...path, ...valueConditionPath(result.conditions)].map((item) => item.header), property, result.text])
        }
      }
    } finally { visiting.delete(rules) }
  }

  visit(source, sourceOutput)
  while (pending.size) {
    const [address, entry] = pending.entries().next().value!
    pending.delete(address)
    const output: typeof sourceOutput = { records: [], defaults: [] }
    visit([entry], output)
    definitions.set(address, output)
  }
  const outputs = [sourceOutput, ...definitions.values()]
  const records = outputs.flatMap((output) => output.records)
  const defaults = outputs.flatMap((output) => output.defaults)
  const missingDefaults = defaults.filter(([path, key]) => !records.some(([existing, property]) =>
    property === key && JSON.stringify(existing) === JSON.stringify(path)))
  return [...missingDefaults, ...records]
}

/** 按记录顺序开闭嵌套块，不解释属性内容。 */
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

/** 编译规则；失败时不返回部分 CSS。 */
export function compileRules(source: Rules): string {
  return stringifyCSS(resolveRules(source))
}
