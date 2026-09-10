/** 保存可组合的 CSS 表达、挂载位置及激活依赖，最终输出时才求值。 */
export type CssRaw = string | number
export type CssContent = CssRaw | CssBlock | ((slot: CssSlot) => CssRaw | CssBlock)

export interface CssSlot {
  hasAttachment: boolean
  /** 在最终表达中展开接入内容。 */
  [Symbol.toPrimitive](): string
}

export interface CssBlock {
  /** 接通自身及依赖，同一对象只激活一次。 */
  activate(): void
  /** 将内容接入唯一 slot，并继承激活关系。 */
  attach(...blocks: CssBlock[]): CssBlock
  /** 替换延迟表达，不提前求值。 */
  setValue(content: CssContent): void
  /** 将当前表达转换为浏览器可用的原始值。 */
  toCssRaw(): CssRaw
  /** 支持最终表达中的插值。 */
  [Symbol.toPrimitive](): CssRaw
}

/** 判断输入是否为统一 CSS 表达对象。 */
export function isCssBlock(value: unknown): value is CssBlock {
  return typeof value === 'object' && value !== null && 'toCssRaw' in value
}

/** 创建表达片段；依赖只传播激活，attach 的输出位置由 slot 指定。
 * @example
 * const rule = cssBlock(slot => `.example { ${slot} }`)
 * rule.attach(cssBlock('color: blue;'))
 */
export function cssBlock(
  content: CssContent = slot => String(slot),
  options?: { dependence?: CssBlock[]; onActive?: () => void },
): CssBlock {
  const attachments: CssBlock[] = []
  let currentContent = content
  let isActive = false
  const slot: CssSlot = {
    get hasAttachment() { return attachments.length > 0 },
    /** 按挂载顺序展开，不补充括号或过滤内容。 */
    [Symbol.toPrimitive]() { return attachments.map(block => String(block)).join('\n') },
  }
  const block: CssBlock = {
    activate() {
      if (isActive) return
      isActive = true
      if (isCssBlock(currentContent)) currentContent.activate()
      options?.dependence?.forEach(dependency => dependency.activate())
      attachments.forEach(child => child.activate())
      options?.onActive?.()
    },
    attach(...children) {
      attachments.push(...children)
      if (isActive) children.forEach(child => child.activate())
      return block
    },
    setValue(nextContent) {
      currentContent = nextContent
      if (isActive && isCssBlock(nextContent)) nextContent.activate()
    },
    toCssRaw() {
      const result = typeof currentContent === 'function' ? currentContent(slot) : currentContent
      return isCssBlock(result) ? result.toCssRaw() : result
    },
    [Symbol.toPrimitive]() { return block.toCssRaw() },
  }
  return block
}
