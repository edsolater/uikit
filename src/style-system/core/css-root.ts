/** CSSRoot 的源账本、编译与提交。 */
import { compileRules } from '../compiler/compile-css'
import { propertyName } from './css-key'
import type { Rule, RuleAddress, RuleHandle, Rules } from './css-rule'

/** 宿主已有内容与上次提交结果。 */
interface MountedRules {
  prefix: string
  css: string
}

/** Style System 的唯一源账本。 */
class Root {
  private source: Rules = new Map()
  private writers = new WeakMap<RuleAddress, object>()
  private hosts = new WeakMap<HTMLStyleElement, MountedRules>()

  /** 登记 Rule；同址后写接管所有权并保留首次位置。 */
  register([address, input]: Rule): RuleHandle {
    const property = address[1] === undefined ? undefined : propertyName(address[1])
    const existing = [...this.source.keys()].find(([path, key]) =>
      (key === undefined ? undefined : propertyName(key)) === property
      && (path?.length ?? 0) === (address[0]?.length ?? 0)
      && (path ?? []).every((item, index) => item.header === address[0]?.[index].header))
    const target = existing ?? address
    target[0] = address[0]
    target[1] = address[1]
    const writer = {}
    this.source.set(target, input)
    this.writers.set(target, writer)
    return {
      /** 删除本次仍拥有的条目。 */
      remove: () => {
        if (this.writers.get(target) !== writer) return
        this.source.delete(target)
        this.writers.delete(target)
      },
      /** 更新本次仍拥有的条目。 */
      replace: (value) => {
        if (this.writers.get(target) !== writer) throw new Error('当前句柄已失效或被后续写入替代。')
        this.source.set(target, value)
      },
    }
  }

  /** 编译源账本快照，不提交 DOM。 */
  compile(): string {
    return compileRules(new Map(this.source))
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
