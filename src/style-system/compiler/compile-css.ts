/** 把源 Rules 与按需依赖编译为 CSS string。 */
import { conditionPathKey, type ConditionPath } from '../core/css-condition'
import { isCSSPair } from '../core/css-declaration'
import { declarationSyntax, propertyName, type CSSKey } from '../core/css-key'
import type { Rules, RuleValue } from '../core/css-rule'
import type { Value, ValueInput } from '../core/css-value'
import { isVariable, type VariableInput } from '../core/css-variable'
import { compileDeclaration, compileVariableDeclaration, expandProperty } from './compile-declaration'
import { compileValue, type ValueContext } from './compile-value'

/** 一条待输出声明。 */
interface CompiledDeclaration { path: ConditionPath; property?: string; text: string }

/** 按完整主体替换的具名 CSS 定义。 */
interface CompiledDefinition {
  owner: Rules
  defaults: Map<string, CompiledDeclaration>
  declarations: Map<string, CompiledDeclaration>
}

/** 合并默认声明与显式声明，显式同址优先。 */
function applyDefaults(defaults: Map<string, CompiledDeclaration>, declarations: Map<string, CompiledDeclaration>): CompiledDeclaration[] {
  return [...[...defaults].filter(([address]) => !declarations.has(address)).map(([, entry]) => entry), ...declarations.values()]
}

/** 编译 Rules 快照；按需依赖只进入本次结果，失败时直接抛错。 */
export function compileRules(source: Rules): string {
  const pending = new Set<Rules>([source])
  const activated = new Set<Value>()
  const visitingRules = new Set<Rules>()
  const declarations = new Map<string, CompiledDeclaration | CompiledDefinition>()
  const variableDefaults = new Map<string, CompiledDeclaration>()
  const resolving = new Map<object, Set<string>>()
  let compilingSource = source
  /** 写入编译结果；同址覆盖不移动位置，具名定义按 owner 整体替换。 */
  const write = (path: ConditionPath, property: string | undefined, text: string, owner = compilingSource, isDefault = false) => {
    const address = JSON.stringify([conditionPathKey(path), property])
    const definitionIndex = path.findIndex((item) => /^@(function|keyframes|property)\s/.test(item.header))
    if (definitionIndex === -1) {
      if (isDefault) variableDefaults.set(address, { path, property, text })
      else declarations.set(address, { path, property, text })
      return
    }
    const definitionAddress = `definition:${conditionPathKey(path.slice(0, definitionIndex + 1))}`
    const previous = declarations.get(definitionAddress)
    const definition = previous && 'owner' in previous && previous.owner === owner
      ? previous
      : { owner, defaults: new Map<string, CompiledDeclaration>(), declarations: new Map<string, CompiledDeclaration>() }
    const target = isDefault ? definition.defaults : definition.declarations
    target.set(address, { path, property, text })
    declarations.set(definitionAddress, definition)
  }
  /** 解读 Rules、Declaration 或 Value；递归 Rules 直接报错。 */
  const visit = (input: RuleValue, path: ConditionPath, key?: CSSKey, definitionOwner?: Rules): void => {
    const context: ValueContext = {
      root: source, path, key, resolving,
      /** 为当前消费地址补充同名变量的条件默认值。 */
      defineVariable(name, values, location) {
        for (const value of values) {
          const path = [...location.path, ...value.path]
          const property = `--${name}`
          write(path, property, value.text, definitionOwner, true)
        }
      },
      /** 完整 Rules 继续继承当前声明位置。 */
      visitRules(rules, location) { visit(rules, location, key, definitionOwner) },
      /** 激活对象一次，并收集本次编译依赖。 */
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
          visit(child, [...path, ...(relativePath ?? [])], nextProperty ?? key, owner)
        }
      } finally { visitingRules.delete(input) }
      return
    }
    if (isVariable(key) && !isCSSPair(input)) {
      for (const result of compileVariableDeclaration(key, input as VariableInput, context)) write([...path, ...result.path], result.property, result.text, definitionOwner)
      return
    }
    if (isCSSPair(input)) {
      const [declarationKey, content] = input
      if (content === undefined) return
      if (typeof declarationKey === 'object' && 'kind' in declarationKey) context.activate(declarationKey)
      const syntax = declarationSyntax(declarationKey)
      if ((syntax === 'value' && !isVariable(declarationKey)) || content instanceof Map) {
        visit(content as ValueInput, path, declarationKey, definitionOwner)
        return
      }
      for (const result of compileDeclaration(input, { ...context, key: declarationKey })) write([...path, ...result.path], result.property, result.text, definitionOwner)
      return
    }
    for (const result of compileValue(input, context)) {
      if (key === undefined) write([...path, ...result.path], undefined, result.text, definitionOwner)
      else for (const declaration of expandProperty(propertyName(key), result)) write([...path, ...declaration.path], declaration.property, declaration.text, definitionOwner)
    }
  }
  for (const Rules of pending) {
    compilingSource = Rules
    visit(Rules, [])
  }

  // 只复用连续地址的公共前缀，不重排声明。
  let path: ConditionPath = []
  const css: string[] = []
  const output = [
    ...[...variableDefaults].filter(([address]) => !declarations.has(address)).map(([, entry]) => entry),
    ...[...declarations.values()].flatMap((entry) => 'owner' in entry ? applyDefaults(entry.defaults, entry.declarations) : [entry]),
  ]
  for (const declaration of output) {
    let shared = 0
    while (shared < path.length && shared < declaration.path.length && path[shared].header === declaration.path[shared].header) shared++
    for (let index = path.length; index > shared; index--) css.push('}')
    for (const item of declaration.path.slice(shared)) css.push(`${item.header} {`)
    css.push(declaration.property === undefined ? declaration.text : `${declaration.property}: ${declaration.text};`)
    path = declaration.path
  }
  for (let index = path.length; index > 0; index--) css.push('}')
  return css.join('\n')
}
