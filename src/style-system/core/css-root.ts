/** 将实际 Block 对象接通并写入固定的 #css-root 样式节点。 */
import type { Block } from './css-block'

/** 唯一 stylesheet 挂载节点，自身没有激活生命周期。 */
export interface Root {
  children: Block[]
  /** 直接挂载输入对象，不创建另一份对象。 */
  attach(...blocks: Block[]): Root
}

/** 固定根保存实际对象，多处使用不向对象反复覆盖单个 parent 或 index。 */
export const root: Root = {
  children: [],
  /** 接通并追加完整规则，固定 style#css-root 必须已存在。
   * @example
   * root.attach(selector('.button').attach(property('color', value('blue'))))
   */
  attach(...blocks) {
    for (const child of blocks) {
      const stylesheet = document.querySelector<HTMLStyleElement>('style#css-root')?.sheet
      if (!stylesheet) throw new Error('缺少样式挂载节点：<style id="css-root"></style>')
      child.activate()
      stylesheet.insertRule(child.parseCss(), stylesheet.cssRules.length)
      this.children.push(child)
    }
    return this
  },
}
