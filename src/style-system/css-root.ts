/** CSSRoot 的源账本与编译入口。
 *
 * 隔离每次编译的规则容器，将完整 CSS 提交到宿主。
 *
 * 让回调改写本次规则时不污染登记来源或直接输入。
 */
import { assert } from '@edsolater/fnkit'
import { rulesToStyleNodes } from './compiler/rules-to-style-nodes'
import { styleNodesToContentNodes } from './compiler/style-nodes-to-content-nodes'
import { contentNodesToCSSString } from './compiler/content-nodes-to-css-string'
import type { Rule, RuleHandle, Rules } from './rule'

/** 依次将源 Rules 建为样式节点、已编译内容节点和 CSS 字符串。 */
export function compileRules(sourceRules: Rules): string {
  const styleNodes = rulesToStyleNodes(sourceRules)
  const snapshot = snapshotRules(sourceRules)
  const contentNodes = styleNodesToContentNodes(styleNodes, snapshot)
  return contentNodesToCSSString(contentNodes)
}

/** 只复制规则容器和路径数组；业务对象保留身份，循环嵌套明确拒绝。 */
function snapshotRules(source: Rules, visiting = new Set<Rules>()): Rules {
  assert(!visiting.has(source), 'Rules 内容存在递归引用，无法生成 CSS。')
  visiting.add(source)
  try {
    return source.map(([path, key, content]) => [
      path?.slice(),
      key,
      Array.isArray(content) ? snapshotRules(content, visiting) : content,
    ])
  } finally { visiting.delete(source) }
}

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
        assert(this.source.includes(entry), '当前句柄已删除。')
        entry[2] = value
      },
    }
  }

  /** 编译源账本快照，不提交 DOM。 */
  compile(): string {
    return compileRules(this.source)
  }

  /** 提交到 `style#css-root`；保留宿主前缀，失败或未变化时不改 DOM。 */
  mount(): this {
    const style = typeof document === 'undefined' ? null : document.querySelector<HTMLStyleElement>('style#css-root')
    assert(!!style?.sheet, '缺少样式挂载节点：<style id="css-root"></style>')
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
