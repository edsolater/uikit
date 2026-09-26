/** JSS 声明目标的创建、识别与名称解析。 */
/** 原生属性名称。 */
export interface JSSKeyObject {
  toCSSString(): string
}

/** 原生属性名称与可输出的自定义 Key。 */
export interface JSSKeyDefinition<K extends string = string> extends JSSKeyObject {
  name: K
}

/** 属性或变量声明目标。 */
export type JSSKey = JSSKeyObject | string

const names = new Map<string, JSSKeyDefinition>()

/** 将原生属性名转换为对象声明使用的驼峰名称。 */
function propertyAlias(name: string): string {
  return name.replace(/-([a-z0-9])/g, (_, character: string) => character.toUpperCase())
}

/** 登记属性原名与对象声明别名；同名目标不允许静默改指其他属性。 */
export function registerJSSKey(target: JSSKeyDefinition): void {
  const aliases = target.name.startsWith('--') ? [target.name] : [...new Set([target.name, propertyAlias(target.name)])]
  for (const name of aliases) {
    const existing = names.get(name)
    if (existing && existing.name !== target.name) throw new Error(`JSSKey 名称冲突：${name}。`)
  }
  for (const name of aliases) if (!names.has(name)) names.set(name, target)
}

/** 创建 JSSKey。 */
export function key<K extends string>(name: K): JSSKeyDefinition<K> {
  const target: JSSKeyDefinition<K> = { name, toCSSString: () => name }
  registerJSSKey(target)
  return target
}

/** 识别声明目标。 */
export function isJSSKey(input: unknown): input is JSSKey {
  return typeof input === 'string' || (input !== null && (typeof input === 'object' || typeof input === 'function')
    && 'toCSSString' in input && typeof input.toCSSString === 'function')
}

/** 解析对象与字符串条目中的声明名称；原生属性和自定义属性保持字符串入口。 */
export function resolveJSSKey(input: JSSKey): JSSKey {
  if (typeof input !== 'string') return input
  const registered = names.get(input)
  if (registered) return registered
  if ((input.startsWith('--') && input.length > 2) || /^-?[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(input)) return input
  throw new Error(`未知 JSSKey 名称：${input}。`)
}

/** 取得原生属性名。 */
export function propertyName(key: JSSKey): string {
  return typeof key === 'string' ? key : key.toCSSString()
}
