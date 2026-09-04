/** 用通用 CssValue 生命周期表达 custom property 引用与按需注册。 */
import { cssValueSequence, type CssValue, type CssValueContent } from './css-value'
import { withCssValueActivation } from './css-value-activation'

export interface CssVariable extends CssValue {
  name: string
}

export interface CssVariableProperty {
  syntax: string
  inherits: boolean
  initialValue?: CssValueContent
}

export interface CssVariableOptions {
  fallback?: CssValueContent
  property?: CssVariableProperty
}

const propertyDefinitionsByDocument = new WeakMap<Document, Map<string, string>>()
const propertyStyleByDocument = new WeakMap<Document, HTMLStyleElement>()

/**
 * 创建 custom property 引用；存在 property 定义时只在 value 首次真实解析时注册。
 *
 * @example
 * const progress = cssVariable('progress', {
 *   fallback: 0,
 *   property: { syntax: '<number>', inherits: false, initialValue: 0 },
 * })
 */
export function cssVariable(name: string, options: CssVariableOptions = {}): CssVariable {
  const variableName = normalizeVariableName(name)
  const reference =
    options.fallback === undefined
      ? cssValueSequence('var(', variableName, ')')
      : cssValueSequence('var(', variableName, ', ', options.fallback, ')')
  /** 保留 CssVariable 与其引用结果之间的嵌套关系。 */
  function readVariableReference(): CssValue {
    return reference
  }

  const variable: CssVariable = { name: variableName, cssString: readVariableReference }

  if (options.property) {
    withCssValueActivation(variable, ({ document, parse }) =>
      registerProperty(document, variableName, options.property!, parse),
    )
  }
  return variable
}

/** 在一个 Document 中记录 property，并维护一份只增不减的定义样式。 */
function registerProperty(
  document: Document,
  name: string,
  property: CssVariableProperty,
  parse: (content: CssValueContent) => string,
): void {
  let definitions = propertyDefinitionsByDocument.get(document)
  if (!definitions) {
    definitions = new Map()
    propertyDefinitionsByDocument.set(document, definitions)
  }

  const definition = createPropertyDefinition(name, property, parse)
  const currentDefinition = definitions.get(name)
  if (currentDefinition && currentDefinition !== definition) {
    throw new Error('CssVariable “' + name + '”在同一 Document 中存在冲突的 @property 定义。')
  }
  if (currentDefinition) return

  definitions.set(name, definition)
  let style = propertyStyleByDocument.get(document)
  if (!style?.isConnected) {
    style = document.createElement('style')
    style.dataset.uikitCssProperties = ''
    document.head.append(style)
    propertyStyleByDocument.set(document, style)
  }
  style.textContent = [...definitions.values()].join('\n\n')
}

/** 在最终激活边界把 property 元数据解析为浏览器原生规则。 */
function createPropertyDefinition(
  name: string,
  property: CssVariableProperty,
  parse: (content: CssValueContent) => string,
): string {
  const lines = ['  syntax: ' + JSON.stringify(property.syntax) + ';', '  inherits: ' + String(property.inherits) + ';']
  if (property.initialValue !== undefined) lines.push('  initial-value: ' + parse(property.initialValue) + ';')
  return '@property ' + name + ' {\n' + lines.join('\n') + '\n}'
}

/** 接受带或不带 -- 的变量名，并拒绝不能组成 custom property 的输入。 */
function normalizeVariableName(name: string): string {
  const normalizedName = name.trim()
  const variableName = normalizedName.startsWith('--') ? normalizedName : '--' + normalizedName
  if (variableName.length <= 2 || /\s/.test(variableName)) throw new Error('CssVariable 名称不合法：' + name)
  return variableName
}
