/** CSSRoot 的源账本、编译与提交。 */
import { compileRules } from '../compiler/compile-css'
import type { Rule, RuleHandle, Rules } from './css-rule'

/** 宿主已有内容与上次提交结果。 */
interface MountedRules {
  prefix: string
  css: string
}

/** Style System 的唯一源账本。 */
class Root {
  private source: Rules = []
  private hosts = new WeakMap<HTMLStyleElement, MountedRules>()

  /** 按顺序登记；句柄只控制自己的声明，覆盖交给 CSS。 */
  register(entry: Rule): RuleHandle {
    this.source.push(entry)
    return {
      /** 删除本次登记。 */
      remove: () => {
        const index = this.source.indexOf(entry)
        if (index !== -1) this.source.splice(index, 1)
      },
      /** 更新本次登记；删除后报错。 */
      replace: (value) => {
        if (!this.source.includes(entry)) throw new Error('当前句柄已删除。')
        entry[2] = value
      },
    }
  }

  /** 编译源账本快照，不提交 DOM。 */
  compile(): string {
    return compileRules(this.source.slice())
  }

  /** 提交到 `style#css-root`；保留宿主前缀，失败或未变化时不改 DOM。 */
  mount(): this {
    const style = typeof document === 'undefined' ? null : document.querySelector<HTMLStyleElement>('style#css-root')
    if (!style?.sheet) throw new Error('缺少样式挂载节点：<style id="css-root"></style>')
    const mounted = this.hosts.get(style) ?? {
      prefix: Array.from(style.sheet.cssRules, (rule) => rule.cssText).join('\n'),
      css: '',
    }
    const css = this.compile()
    if (css !== mounted.css) style.textContent = [mounted.prefix, css].filter(Boolean).join('\n')
    this.hosts.set(style, { prefix: mounted.prefix, css })
    return this
  }
}

const root = new Root()

/** 应用启动入口。 */
export const cssRoot = {
  /** 在组件渲染前把已登记 Rules 提交到固定宿主。 */
  mount() {
    root.mount()
    return this
  },
}

/** 向源账本登记 Rule。 */
export function registerRule(entry: Rule): RuleHandle {
  return root.register(entry)
}

/** 生成当前源账本的 CSS string，不写 DOM。 */
export function compileCSS(): string {
  return root.compile()
}
