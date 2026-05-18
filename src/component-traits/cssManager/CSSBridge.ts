/**
 * CSSBridge 是一个轻量级的工具类，用于在运行时动态管理 CSS 规则的DOM API。
 */
import { assert, shrinkFn } from '@edsolater/fnkit'
import type { TraitName } from '../type'

type CSSBlockId = string
type CSSText = string

/**
 * CSSBridge 是一个轻量级的工具类，用于在运行时动态管理 CSS 规则的DOM API。
 * 它是进入CSS世界的唯一入口
 */
export class CSSBridge {
  private sheet: CSSStyleSheet

  // 记录每个 id 对应的真实 CSSRule 对象。
  // 删除时按对象引用删除，不根据 selectorText 猜测。
  private registedCSSBlocks = new Map<CSSBlockId, { text: string; rules: CSSRule[] }>()

  constructor(styleId = 'dynamic-css-blocks') {
    // 复用已有的统一 <style>，避免重复创建动态样式容器。
    let style = document.getElementById(styleId) as HTMLStyleElement | null

    // 如果还没有动态样式容器，就创建一个并挂到 document.head。
    if (!style) {
      style = document.createElement('style')
      style.id = styleId
      document.head.append(style)
    }

    // 所有后续操作都只需要 CSSStyleSheet。
    // HTMLStyleElement 本身不需要保存到实例字段里。
    if (!style.sheet) {
      throw new Error('Failed to create dynamic stylesheet.')
    }

    this.sheet = style.sheet
  }

  set(id: CSSBlockId, cssText: CSSText): void {
    return this.upsert(id, cssText)
  }

  // 原始CSS文本
  update(id: CSSBlockId, cssText: CSSText | ((prev: CSSText) => CSSText)): void {
    const prevRules = this.registedCSSBlocks.get(id)
    assert(prevRules, `CSS block with id "${id}" does not exist.`)
    const prevCSS = prevRules.text
    const newCSS = shrinkFn(cssText, [prevCSS])
    return this.upsert(id, newCSS)
  }

  private upsert(id: CSSBlockId, cssText: CSSText): void {
    // 同 id 再次 upsert 时，先删除旧 block。
    // 这样 upsert 的语义就是覆盖更新。
    this.delete(id)

    // 用临时 CSSStyleSheet 解析整段 CSS。
    // 这样可以支持多条规则、嵌套 CSS、@media、@supports、@container 等结构。
    const tempCSSParser = new CSSStyleSheet()

    try {
      // 把 CSS 文本解析成 CSSStyleSheet.cssRules
      tempCSSParser.replaceSync(cssText)
    } catch (error) {
      // CSS 语法非法时，浏览器解析会失败。
      // 带上 id，方便定位是哪一段动态 CSS 出错。
      throw new Error(`Invalid CSS block: ${id}`, { cause: error })
    }

    // 非空 CSS 解析后没有 rule，通常说明这段 CSS 没有实际产物。
    if (cssText.trim() && tempCSSParser.cssRules.length === 0) {
      throw new Error(`CSS block produced no rules: ${id}`)
    }

    // 这里记录的是插入到主 stylesheet 后的真实 CSSRule。
    // 不能记录 tempCSSParser.cssRules，因为那只是临时 stylesheet 的 rule。
    const insertedRules: CSSRule[] = []

    // insertRule 一次只能插入一条顶层 rule，所以要逐条复制。
    for (const rule of Array.from(tempCSSParser.cssRules)) {
      // 插到末尾，保持动态 CSS 的插入顺序。
      const index = this.sheet.cssRules.length

      // rule.cssText 是浏览器解析后的标准化 CSS 文本。
      // 用它把临时 rule 复制到真实 stylesheet。
      this.sheet.insertRule(rule.cssText, index)

      // insertRule 不返回 CSSRule 对象。
      // 所以插入后要从主 stylesheet 的对应位置重新取出真实 rule。
      insertedRules.push(this.sheet.cssRules[index])
    }

    // 建立 id 到真实 CSSRule 对象列表的映射。
    this.registedCSSBlocks.set(id, { text: cssText, rules: insertedRules })
  }

  delete(id: CSSBlockId): boolean {
    // 找到这个 id 对应的真实 CSSRule 列表。
    const block = this.registedCSSBlocks.get(id)
    if (!block) return false

    // 用对象引用做精确匹配。
    // 不做 startsWith / includes / selectorText 推断。
    const targets = new Set(block.rules)

    // 倒序删除，避免 deleteRule 后 cssRules 索引移动导致漏删。
    for (let i = this.sheet.cssRules.length - 1; i >= 0; i--) {
      const rule = this.sheet.cssRules[i]

      if (targets.has(rule)) {
        this.sheet.deleteRule(i)
      }
    }

    // 删除完成后清理 registry。
    this.registedCSSBlocks.delete(id)

    return true
  }

  has(id: CSSBlockId): boolean {
    // 判断某个 id 是否已经存在。
    return this.registedCSSBlocks.has(id)
  }

  clear(): void {
    // 清空当前动态 stylesheet 里的所有 rule。
    for (let i = this.sheet.cssRules.length - 1; i >= 0; i--) {
      this.sheet.deleteRule(i)
    }

    // 同步清空 id 映射。
    this.registedCSSBlocks.clear()
  }
}

/**
 * TODO: 🤔 可能是有点过度设计了， 先留着吧
 * 工具级基础函数
 * @example 应用在./Button/style.ts里（此处的Button只是随便的组件名）
 */
export function inCSSRegistry<T>(options: {
  /** 只应该控制自身组件的命名空间 */
  namespace: string
}): { set: (id: string, cssText: string) => void; withTraits: (...names: TraitName[]) => void } {
  throw new Error('useCSSRegistry is not implemented yet.')
}
