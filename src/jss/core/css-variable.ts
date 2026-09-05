/** 用 CssValue 表达 custom property，并在激活时注册它拥有的全局默认与状态规则。 */
import { cssDeclaration, type CssDeclaration } from './css-declaration'
import {
  cssValueSequence,
  isCssValue,
  withCssValueDependencies,
  type CssValue,
  type CssValueContent,
} from './css-value'
import { withCssValueActivation } from './css-value-activation'

export interface CssVariable extends CssValue {
  name: string
  /** 取得一项显式局部 custom property declaration。 */
  declaration: (value?: CssVariableDeclarationValue) => CssDeclaration
}

export interface CssVariableProperty {
  syntax: string
  inherits: boolean
  initialValue?: CssValueContent
}

export interface CssVariableStateValues {
  default: CssValueContent
  hover?: CssValueContent
  active?: CssValueContent
  focusVisible?: CssValueContent
}

export type CssVariableDeclarationValue = CssValueContent

export interface CssVariableOptions {
  fallback?: CssValueContent
  property?: CssVariableProperty
  value?: CssVariableDeclarationValue | CssVariableStateValues
}

interface CssVariableRegistration {
  cssText: string
}

const registrationsByDocument = new WeakMap<Document, Map<string, CssVariableRegistration>>()
const registrationStyleByDocument = new WeakMap<Document, HTMLStyleElement>()

/**
 * 创建 custom property value，并把可选全局配方保留到真实激活。
 *
 * @example
 * const color = cssVariable('smart-color', {
 *   property: { syntax: '<color>', inherits: true, initialValue: 'blue' },
 *   value: { default: 'blue', hover: 'green', active: 'red', focusVisible: 'orange' },
 * })
 * const colorDeclaration = color.declaration()
 */
export function cssVariable(name: string, options: CssVariableOptions = {}): CssVariable {
  const variableName = normalizeVariableName(name)
  const reference =
    options.fallback === undefined
      ? cssValueSequence('var(', variableName, ')')
      : cssValueSequence('var(', variableName, ', ', options.fallback, ')')

  const stateValues = readStateValues(options.value)
  let variable: CssVariable

  /** 交付变量引用的嵌套 value 结果。 */
  function readVariableReference(): CssValue {
    return reference
  }

  /** 取得显式局部声明，并连接变量自身的激活生命周期。 */
  function declaration(value: CssVariableDeclarationValue | undefined = stateValues.default): CssDeclaration {
    if (value === undefined) throw new Error('CssVariable “' + variableName + '”没有可用的 declaration value。')
    return cssDeclaration(variableName, value, [variable])
  }

  variable = { name: variableName, cssString: readVariableReference, declaration }

  const dependencies = [
    options.fallback,
    options.property?.initialValue,
    stateValues.default,
    stateValues.hover,
    stateValues.active,
    stateValues.focusVisible,
  ].filter((content): content is CssValueContent => content !== undefined)
  withCssValueDependencies(variable, ...dependencies)

  if (options.property || options.value !== undefined) {
    withCssValueActivation(variable, ({ document, parse }) => {
      registerVariable(document, variableName, options.property, stateValues, parse)
    })
  }
  return variable
}

/** 把普通默认值和状态值统一成变量自身的状态配方。 */
function readStateValues(value: CssVariableOptions['value']): Partial<CssVariableStateValues> {
  if (value === undefined) return {}
  if (isCssVariableStateValues(value)) return value
  return { default: value }
}

/** 判断 options value 是否是带默认项的状态配方。 */
function isCssVariableStateValues(value: CssVariableOptions['value']): value is CssVariableStateValues {
  return !isCssValue(value) && typeof value === 'object' && value !== null && 'default' in value
}

/** 在所属 Document 中注册变量自己拥有的全局 CSS 配方。 */
function registerVariable(
  document: Document,
  name: string,
  property: CssVariableProperty | undefined,
  values: Partial<CssVariableStateValues>,
  parse: (content: CssValueContent) => string,
): void {
  const rules: string[] = []
  const parsedValues = new Map<CssValueContent, string>()

  /** 在一份变量注册中只读取同一个内容对象一次。 */
  function parseOnce(content: CssValueContent): string {
    const parsed = parsedValues.get(content)
    if (parsed !== undefined) return parsed
    const cssText = parse(content)
    parsedValues.set(content, cssText)
    return cssText
  }

  const initialValue = property?.initialValue === undefined ? undefined : parseOnce(property.initialValue)
  const defaultValue = values.default === undefined ? undefined : parseOnce(values.default)
  if (property) rules.push(createPropertyRule(name, property, initialValue))
  if (defaultValue !== undefined && defaultValue !== initialValue) {
    rules.push(createValueRule(':where(:root)', name, defaultValue))
  }
  if (values.hover !== undefined) rules.push(createValueRule(':where(:hover)', name, parseOnce(values.hover)))
  if (values.active !== undefined) rules.push(createValueRule(':where(:active)', name, parseOnce(values.active)))
  if (values.focusVisible !== undefined) {
    rules.push(createValueRule(':where(:focus-visible)', name, parseOnce(values.focusVisible)))
  }
  updateVariableRegistration(document, name, rules.join('\n\n'))
}

/** 把 property 元数据保留到注册输出边界再解释。 */
function createPropertyRule(
  name: string,
  property: CssVariableProperty,
  initialValue: string | undefined,
): string {
  const lines = ['  syntax: ' + JSON.stringify(property.syntax) + ';', '  inherits: ' + String(property.inherits) + ';']
  if (initialValue !== undefined) lines.push('  initial-value: ' + initialValue + ';')
  return '@property ' + name + ' {\n' + lines.join('\n') + '\n}'
}

/** 把一个变量状态交付为保持全局低权重的 CSS rule。 */
function createValueRule(
  selector: string,
  name: string,
  value: string,
): string {
  return selector + ' {\n  ' + name + ': ' + value + ';\n}'
}

/** 幂等合并一个变量的完整注册配方，并刷新所属 Document 的注册样式。 */
function updateVariableRegistration(
  document: Document,
  name: string,
  cssText: string,
): void {
  const registrations = registrationsByDocument.get(document) ?? new Map<string, CssVariableRegistration>()

  const registeredCss = registrations.get(name)?.cssText
  if (registeredCss && registeredCss !== cssText) {
    throw new Error('CssVariable “' + name + '”在同一 Document 中存在冲突的注册。')
  }
  const nextRegistrations = new Map(registrations)
  if (!registeredCss) nextRegistrations.set(name, { cssText })

  let style = registrationStyleByDocument.get(document)
  if (!style?.isConnected) {
    style = document.createElement('style')
    style.dataset.uikitCssVariables = ''
  }

  style.textContent = [...nextRegistrations.values()]
    .map((registeredVariable) => registeredVariable.cssText)
    .join('\n\n')
  if (!style.isConnected) document.head.append(style)
  registrationsByDocument.set(document, nextRegistrations)
  registrationStyleByDocument.set(document, style)
}

/** 接受带或不带 `--` 的变量名，并拒绝不能组成 custom property 的输入。 */
function normalizeVariableName(name: string): string {
  const normalizedName = name.trim()
  const variableName = normalizedName.startsWith('--') ? normalizedName : '--' + normalizedName
  if (variableName.length <= 2 || /\s/.test(variableName)) throw new Error('CssVariable 名称不合法：' + name)
  return variableName
}
