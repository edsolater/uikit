/** 将源 Rules 及本次激活的依赖编译为按地址顺序排列的 CSS string。 */
import type { ConditionPath } from '../core/css-condition'
import { isCSSPair } from '../core/css-declaration'
import { declarationSyntax, propertyName, type CSSKey } from '../core/css-key'
import type { Rules, RuleValue } from '../core/css-rule'
import type { Value, ValueInput } from '../core/css-value'
import { isVariable } from '../core/css-variable'
import { compileDeclaration, compileVariableDeclaration, expandProperty } from './compile-declaration'
import { compileValue, compileAt, resolveValue, valuePaths, conditionPathKey, type ValueContext } from './compile-value'

/** 最终 CSS 输出队列中的一条完整地址与声明文本。 */
interface CompiledDeclaration { path: ConditionPath; property?: string; text: string }

/** 需要按完整主体替换的具名 CSS 定义，例如 `@property`、`@function` 或 `@keyframes`。 */
interface CompiledDefinition { owner: Rules; declarations: Map<string, CompiledDeclaration> }

/**
 * 从给定源账本生成完整 CSS，不改动账本或 DOM；供 CSSRoot 的快照编译使用。
 * 每个可达 Value 在本次编译最多激活一次，返回的依赖按发现顺序继续编译，不写回源账本。
 * 同址后写覆盖前写但保留首次位置；具名定义按完整定义替换。递归 Rules 或无法解析的 Value 直接抛错。
 * @example
 * const source: Rules = new Map([[[[condition('.Button')], 'color'], 'red']])
 * compileRules(source) // '.Button {\ncolor: red;\n}'
 */
export function compileRules(source: Rules): string {
  const pending = new Set<Rules>([source])
  const activated = new Set<Value>()
  const visitingRules = new Set<Rules>()
  const declarations = new Map<string, CompiledDeclaration | CompiledDefinition>()
  const resolving = new Map<object, Set<string>>()
  let compilingSource = source
  /**
   * 将已编译文本写入本次输出集合；path 是完整地址，缺少 property 时保留原文。
   * 同址覆盖不移动位置；@function、@keyframes、@property 的 owner 改变时替换整份定义，避免混入旧内容。
   * @example
   * write([], 'color', 'red'); write([], 'color', 'blue')
   * // 输出集合只有 color: blue；位置仍是第一次写入 color 的位置。
   */
  const write = (path: ConditionPath, property: string | undefined, text: string, owner = compilingSource) => {
    const address = JSON.stringify([conditionPathKey(path), property])
    const definitionIndex = path.findIndex((item) => /^@(function|keyframes|property)\s/.test(item.header))
    if (definitionIndex === -1) {
      declarations.set(address, { path, property, text })
      return
    }
    const definitionAddress = `definition:${conditionPathKey(path.slice(0, definitionIndex + 1))}`
    const previous = declarations.get(definitionAddress)
    const definition = previous && 'owner' in previous && previous.owner === owner
      ? previous
      : { owner, declarations: new Map<string, CompiledDeclaration>() }
    definition.declarations.set(address, { path, property, text })
    declarations.set(definitionAddress, definition)
  }
  /**
   * 在消费地址解读 Rules、Declaration 或 Value，并把展开结果交给 write，不直接输出 CSS。
   * 嵌套 Rules 连接相对路径，缺省 Key 继承外层 Key；Declaration 则使用自身 Key。
   * definitionOwner 沿具名定义传递，使整份定义共同参与替换；当前访问链重复进入同一 Rules 时抛错。
   * @example
   * const hover = condition('&:hover')
   * visit(new Map([[[[hover], undefined], 'blue']]), [condition('.Button')], 'color')
   * // 等价于 write([condition('.Button'), hover], 'color', 'blue')。
   */
  const visit = (input: RuleValue, path: ConditionPath, key?: CSSKey, definitionOwner?: Rules): void => {
    const context: ValueContext = {
      root: source, path, key, resolving,
      /**
       * 本次编译首次遇到对象值时调用 onActive；回调得到当前消费位置，返回的 Rules 排入待编译集合。
       * 同一对象再次被引用不重复调用；回调抛错会终止编译，源账本不接收回调返回的依赖。
       * @example
       * const shared = value('red', { onActive: () => new Map() })
       * context.activate(shared); context.activate(shared)
       * // shared.onActive 只执行一次；返回的依赖在当前待编译 Rules 之后处理。
       */
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
      for (const result of compileVariableDeclaration(key, input as ValueInput, context)) write(path, result.property, result.text, definitionOwner)
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
    if (typeof input === 'object' && input.default !== undefined) {
      for (const relativePath of valuePaths(input)) {
        const location = { ...context, path: [...path, ...relativePath] }
        resolveValue(input, relativePath, location, (resolved, exactKey) => {
          if (resolved instanceof Map) visit(resolved, location.path, key, definitionOwner)
          else {
            const result = { path: location.path, text: compileAt(resolved, relativePath, location, exactKey) }
            if (key === undefined) write(result.path, undefined, result.text, definitionOwner)
            else for (const declaration of expandProperty(propertyName(key), result)) write(declaration.path, declaration.property, declaration.text, definitionOwner)
          }
        })
      }
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

  // 输出时只复用连续地址的公共前缀，不移动声明：A/color → B/color → A/background 仍输出三段。
  // 路径后缀变更时先关闭旧层再开启新层；属性为空的文本原样写入，其他文本形成 CSS 声明。
  let path: ConditionPath = []
  const css: string[] = []
  const output = [...declarations.values()].flatMap((entry) => 'owner' in entry ? [...entry.declarations.values()] : [entry])
  for (const declaration of output) {
    let shared = 0
    while (shared < path.length && shared < declaration.path.length && path[shared].name === declaration.path[shared].name) shared++
    for (let index = path.length; index > shared; index--) css.push('}')
    for (const item of declaration.path.slice(shared)) css.push(`${item.header} {`)
    css.push(declaration.property === undefined ? declaration.text : `${declaration.property}: ${declaration.text};`)
    path = declaration.path
  }
  for (let index = path.length; index > 0; index--) css.push('}')
  return css.join('\n')
}
