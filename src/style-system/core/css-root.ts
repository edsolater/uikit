/** 同步激活 CSS，并永久追加到 style#css-root。 */
import { flattenContent, type Content, type Rule } from './css-block'
import type { RenderContext, Value } from './css-value'

/** 每个实例独立去重：同一 Value 只激活一次，同一 Rule 只插入一次。 */
export class Root {
  private readonly activatedValues = new WeakMap<Value, Rule | void>()
  private readonly registeredRules = new WeakSet<Rule>()

  /**
   * 调用前须有可用的 style#css-root；本次调用内完成激活及规则追加。
   * 插入失败会抛错，已插入的规则保留；再次调用可补齐失败规则。
   * @example
   * cssRoot.activate(styleRule('.button')(declaration(key('color'), value('blue'))))
   */
  activate(...rules: Content<Rule>[]): this {
    const stylesheet =
      typeof document === 'undefined' ? undefined : document.querySelector<HTMLStyleElement>('style#css-root')?.sheet
    if (!stylesheet) throw new Error('缺少样式挂载节点：<style id="css-root"></style>')

    const pendingRules = new Set<Rule>(flattenContent<Rule>(rules))
    const renderedRules = new Map<Rule, string>()
    const context: RenderContext = {
      activateValue: (value) => {
        if (!this.activatedValues.has(value)) this.activatedValues.set(value, value.onActive?.())
        const registration = this.activatedValues.get(value)
        if (registration) pendingRules.add(registration)
      },
    }

    for (const rule of pendingRules) {
      // 已插入的规则也要遍历，才能重试上次插入失败的依赖。
      const css = rule.parseCss(context)
      if (!this.registeredRules.has(rule)) renderedRules.set(rule, css)
    }
    for (const [rule, css] of renderedRules) {
      stylesheet.insertRule(css, stylesheet.cssRules.length)
      this.registeredRules.add(rule)
    }
    return this
  }
}

export const cssRoot = new Root()
