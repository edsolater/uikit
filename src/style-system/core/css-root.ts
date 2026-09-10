/** 将 Block 挂载到 HTML 中固定的 #css-root 样式节点。 */
import type { CssBlock } from './css-block'

const mountedBlocks = new Set<CssBlock>()
const pendingBlocks = new Set<CssBlock>()

/** 唯一 stylesheet 根，不需要创建或激活。 */
export const cssRoot = {
  /** 接通 Block 并提交顶层内容；重复挂载同一 Block 不重复写入。 */
  attach(...blocks: CssBlock[]) {
    for (const block of blocks) {
      if (mountedBlocks.has(block) || pendingBlocks.has(block)) continue
      const stylesheet = document.querySelector<HTMLStyleElement>('style#css-root')?.sheet
      if (!stylesheet) throw new Error('缺少样式挂载节点：<style id="css-root"></style>')

      pendingBlocks.add(block)
      try {
        block.activate()
        // 只在提交时展开表达，不增删花括号。
        const parsedStylesheet = new CSSStyleSheet()
        parsedStylesheet.replaceSync(String(block))
        const startIndex = stylesheet.cssRules.length
        try {
          for (const rule of parsedStylesheet.cssRules) {
            stylesheet.insertRule(rule.cssText, stylesheet.cssRules.length)
          }
        } catch (error) {
          while (stylesheet.cssRules.length > startIndex) stylesheet.deleteRule(startIndex)
          throw error
        }
        mountedBlocks.add(block)
      } finally {
        pendingBlocks.delete(block)
      }
    }
    return cssRoot
  },
}
