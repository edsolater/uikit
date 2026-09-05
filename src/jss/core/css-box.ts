/** 保留 CSS 容器的头部、内容结果与原始挂载顺序。 */
import type { CssBlock } from './css-block'
import type { CssValueContent } from './css-value'

const cssBoxIdentity = Symbol('CssBox')

export interface CssBox {
  [cssBoxIdentity]: true
}

export type CssDeclarations = Record<string, CssValueContent | undefined>
export type CssBoxContent = CssDeclarations | CssBox | CssBlock
export type CssBoxKind = 'anonymous' | 'selector' | 'atRule' | 'stylesheet'

export interface CssBoxRecord {
  kind: CssBoxKind
  header?: string
  content: CssBoxContent[]
}

const recordsByBox = new WeakMap<CssBox, CssBoxRecord>()

/** 建立没有显化头部、只负责有序包裹内容的 box。 */
export function cssBox(...content: CssBoxContent[]): CssBox {
  return createCssBox('anonymous', undefined, content)
}

/** 建立以 selector 显化的 box。 */
export function selectorBox(selector: string, ...content: CssBoxContent[]): CssBox {
  return createCssBox('selector', requireHeader(selector, 'SelectorBox'), content)
}

/** 建立以 at-rule 显化的 box。 */
export function atRuleBox(rule: string, ...content: CssBoxContent[]): CssBox {
  const header = requireHeader(rule, 'AtRuleBox')
  if (!header.startsWith('@')) throw new Error('AtRuleBox 的头部必须以 @ 开始。')
  return createCssBox('atRule', header, content)
}

/** 建立能够连接 Document 并激活整条结果树的根 box。 */
export function stylesheetBox(...content: CssBoxContent[]): CssBox {
  return createCssBox('stylesheet', undefined, content)
}

/** 判断对象是否是由当前工具建立的 CssBox。 */
export function isCssBox(value: unknown): value is CssBox {
  return typeof value === 'object' && value !== null && recordsByBox.has(value as CssBox)
}

/** 读取最终解析所需的 box 结果，不改变其中任何内容。 */
export function readCssBox(box: CssBox): CssBoxRecord {
  const record = recordsByBox.get(box)
  if (!record) throw new Error('收到的对象不是由 style-utils 创建的 CssBox。')
  return record
}

/** 建立指定种类的 box，只保存调用方交付的原始内容结果。 */
function createCssBox(kind: CssBoxKind, header: string | undefined, content: CssBoxContent[]): CssBox {
  const box: CssBox = { [cssBoxIdentity]: true }
  recordsByBox.set(box, { kind, header, content: [...content] })
  return box
}

/** 拒绝不能形成显化 box 的空头部。 */
function requireHeader(header: string, boxName: string): string {
  const normalizedHeader = header.trim()
  if (!normalizedHeader) throw new Error(boxName + ' 的头部不能为空。')
  return normalizedHeader
}
