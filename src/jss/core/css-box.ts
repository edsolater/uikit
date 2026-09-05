/** 保留 CSS 容器的头部、内容结果、顺序与挂载关系。 */
import type { CssBlock } from './css-block'
import { activateCssBoxContent } from './css-box-activation'
import type { CssDeclaration } from './css-declaration'

const cssBoxIdentity = Symbol('CssBox')

export interface CssBox {
  [cssBoxIdentity]: true
  /** 按调用顺序连接内容，保留它们的原始结果。 */
  attach: (...content: CssBoxContent[]) => CssBox
}

export type CssBoxContent = CssDeclaration | CssBox | CssBlock
export type CssBoxKind = 'anonymous' | 'selector' | 'atRule' | 'stylesheet'

export interface CssBoxRecord {
  kind: CssBoxKind
  header?: string
  content: CssBoxContent[]
}

export interface CssBoxActivation {
  document: Document
  /** 刷新所属 stylesheet；内容变化时丢弃未完成的旧解析结果。 */
  refresh: (contentChanged?: boolean) => void
  boxes: Set<CssBox>
}

interface CssBoxActivationProgress {
  nextContent: number
  activating: boolean
}

const recordsByBox = new WeakMap<CssBox, CssBoxRecord>()
const activationsByBox = new WeakMap<CssBox, Map<CssBoxActivation, CssBoxActivationProgress>>()

/** 建立没有显化头部、只负责有序包裹内容的内部容器。 */
export function createCssBox(...content: CssBoxContent[]): CssBox {
  return createBox('anonymous', undefined, content)
}

/** 建立以 selector 显化的容器。 */
export function selector(selectorText: string, ...content: CssBoxContent[]): CssBox {
  return createBox('selector', requireHeader(selectorText, 'selector'), content)
}

/** 建立以 at-rule 显化的容器。 */
export function atRule(rule: string, ...content: CssBoxContent[]): CssBox {
  const header = requireHeader(rule, 'atRule')
  if (!header.startsWith('@')) throw new Error('atRule 头部必须以 @ 开始。')
  return createBox('atRule', header, content)
}

/** 建立能够连接 Document 并激活整条结果树的根容器。 */
export function stylesheet(...content: CssBoxContent[]): CssBox {
  return createBox('stylesheet', undefined, content)
}

/** 判断对象是否是由 JSS 建立的 CssBox。 */
export function isCssBox(value: unknown): value is CssBox {
  return typeof value === 'object' && value !== null && recordsByBox.has(value as CssBox)
}

/** 读取最终解析所需的容器结果，不改变其中任何内容。 */
export function readCssBox(box: CssBox): CssBoxRecord {
  const record = recordsByBox.get(box)
  if (!record) throw new Error('收到的对象不是由 JSS 创建的 CssBox。')
  return record
}

/** 激活一个 Box，并从上次成功位置继续传播尚未激活的内容。 */
export function activateCssBox(box: CssBox, activation: CssBoxActivation): boolean {
  const record = readCssBox(box)
  const activations = activationsByBox.get(box)
  if (!activations) throw new Error('CssBox 缺少激活状态。')

  const progress = activations.get(activation) ?? { nextContent: 0, activating: false }
  if (progress.activating) throw new Error('CssBox 挂载关系形成了循环。')
  activations.set(activation, progress)
  activation.boxes.add(box)
  const previousNextContent = progress.nextContent

  progress.activating = true
  try {
    while (progress.nextContent < record.content.length) {
      activateCssBoxContent(record.content[progress.nextContent], activation)
      progress.nextContent += 1
    }
  } finally {
    progress.activating = false
  }
  return progress.nextContent > previousNextContent
}

/** 解除一个 stylesheet 挂载与其全部 Box 的更新关系。 */
export function disconnectCssBoxActivation(activation: CssBoxActivation): void {
  for (const box of activation.boxes) activationsByBox.get(box)?.delete(activation)
  activation.boxes.clear()
}

/** 继续执行一个挂载中尚未成功传播的 Box 内容。 */
export function resumeCssBoxActivation(activation: CssBoxActivation): boolean {
  let changed = false
  for (const box of [...activation.boxes]) changed = activateCssBox(box, activation) || changed
  return changed
}

/** 建立指定头部身份的容器，只保存调用方交付的结果。 */
function createBox(kind: CssBoxKind, header: string | undefined, content: CssBoxContent[]): CssBox {
  let box: CssBox

  /** 把后续内容连接到当前容器并交回同一容器。 */
  function attach(...nextContent: CssBoxContent[]): CssBox {
    const record = readCssBox(box)
    record.content.push(...nextContent)

    const activations = activationsByBox.get(box)
    if (!activations?.size) return box
    let firstError: unknown
    for (const [activation, progress] of activations) {
      if (progress.activating) continue
      try {
        activateCssBox(box, activation)
        activation.refresh(true)
      } catch (error) {
        firstError ??= error
      }
    }
    if (firstError !== undefined) throw firstError
    return box
  }

  box = { [cssBoxIdentity]: true, attach }
  recordsByBox.set(box, { kind, header, content: [...content] })
  activationsByBox.set(box, new Map())
  return box
}

/** 拒绝不能形成显化容器的空头部。 */
function requireHeader(header: string, creatorName: string): string {
  const normalizedHeader = header.trim()
  if (!normalizedHeader) throw new Error(creatorName + ' 的头部不能为空。')
  return normalizedHeader
}
