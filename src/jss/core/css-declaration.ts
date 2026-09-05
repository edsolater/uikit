/** 保留一项 CSS key/value 内容及其 value 激活依赖。 */
import { cssKey, type CssKey } from './css-key'
import type { CssValue, CssValueContent } from './css-value'

const cssDeclarationIdentity = Symbol('CssDeclaration')

export interface CssDeclaration {
  [cssDeclarationIdentity]: true
}

export interface CssDeclarationRecord {
  key: CssKey
  value: CssValueContent
  dependencies: CssValue[]
}

const recordsByDeclaration = new WeakMap<CssDeclaration, CssDeclarationRecord>()

/** 建立仍可挂载的 declaration 结果，不解析 value 或执行激活。 */
export function cssDeclaration(
  key: string | CssKey,
  value: CssValueContent,
  dependencies: CssValue[] = [],
): CssDeclaration {
  const declaration: CssDeclaration = { [cssDeclarationIdentity]: true }
  recordsByDeclaration.set(declaration, {
    key: cssKey(key),
    value,
    dependencies: [...dependencies],
  })
  return declaration
}

/** 判断输入是否是由 JSS 建立的 declaration 结果。 */
export function isCssDeclaration(value: unknown): value is CssDeclaration {
  return typeof value === 'object' && value !== null && recordsByDeclaration.has(value as CssDeclaration)
}

/** 在最终解析边界读取 declaration 保留的内容和依赖。 */
export function readCssDeclaration(declaration: CssDeclaration): CssDeclarationRecord {
  const record = recordsByDeclaration.get(declaration)
  if (!record) throw new Error('收到的对象不是由 JSS 创建的 CssDeclaration。')
  return record
}
