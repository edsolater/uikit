/** CSSRoot 持有源账本，在应用启动时统一编译并提交完整 CSS。 */
import { compileRules } from '../compiler/compile-css'
import { propertyName } from './css-key'
import type { Rule, RuleAddress, RuleHandle, Rules } from './css-rule'

/** 一个宿主已提交的样式状态：prefix 属于宿主原内容，css 属于本 Root 上次生成的内容。 */
interface MountedRules {
  prefix: string
  css: string
}

/** 拥有唯一源 Rules 账本，负责同址写入所有权、快照编译与对宿主样式的原子提交。 */
class Root {
  private source: Rules = new Map()
  private writers = new WeakMap<RuleAddress, object>()
  private hosts = new WeakMap<HTMLStyleElement, MountedRules>()

  /**
   * 写入已归一化的单条 Rule，不编译或触碰 DOM；同址后写覆盖值与地址表达，保留首次插入位置。
   * 返回句柄只控制本次写入。后续同址登记使旧句柄失效，删除最新写入也不会恢复旧值。
   * @example
   * const first = root.register([[[], 'color'], 'red'])
   * const latest = root.register([[[], 'color'], 'blue'])
   * first.remove() // 无影响；账本仍为 color: blue
   * latest.remove() // 账本不再包含 color，不恢复 red
   */
  register([address, input]: Rule): RuleHandle {
    const property = address[1] === undefined ? undefined : propertyName(address[1])
    const existing = [...this.source.keys()].find(([path, key]) =>
      (key === undefined ? undefined : propertyName(key)) === property
      && (path?.length ?? 0) === (address[0]?.length ?? 0)
      && (path ?? []).every((item, index) => item.name === address[0]?.[index].name))
    const target = existing ?? address
    target[0] = address[0]
    target[1] = address[1]
    const writer = {}
    this.source.set(target, input)
    this.writers.set(target, writer)
    return {
      /** 删除仍由本次登记拥有的条目；重复删除或旧句柄删除均无影响。 */
      remove: () => {
        if (this.writers.get(target) !== writer) return
        this.source.delete(target)
        this.writers.delete(target)
      },
      /** 原位更新本次写入；条目已删除或被同址新写入替代时抛错。 */
      replace: (value) => {
        if (this.writers.get(target) !== writer) throw new Error('当前句柄已失效或被后续写入替代。')
        this.source.set(target, value)
      },
    }
  }

  /** 编译当前源账本快照；派生依赖限于此次生成，不提交 DOM。 */
  compile(): string {
    return compileRules(new Map(this.source))
  }

  /**
   * 编译源账本并提交到 style#css-root；宿主或其样式表不存在时抛错，编译失败时保留原 DOM。
   * 首次挂载保留宿主已有 CSS；后续只替换本 Root 生成部分，生成文本未改变时不重写 CSSOM。
   * @example
   * root.mount() // 宿主保留原有样式，并包含当前账本生成的 CSS。
   * root.mount() // 账本和依赖输出未变化时，宿主中的 CSSRule 对象保持原身份。
   */
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

/** 应用启动入口：把当前已登记的全部 Rules 统一编译并挂载到固定 CSS 宿主。 */
export const cssRoot = {
  /**
   * 在应用启动、组件渲染之前统一提交 CSS；调用前必须已有 style#css-root 及静态导入的样式模块。
   * 返回 cssRoot；宿主缺失或编译失败时抛错，不做组件级补偿。挂载细节见 Root.mount。
   * @example
   * rule('.Button', 'color', 'red')
   * cssRoot.mount() // style#css-root 包含 .Button 的 color: red 声明。
   */
  mount() {
    root.mount()
    return this
  },
}

/** 内部登记入口，仅供 rule 与 rules 提交归一化条目；所有权和覆盖协议见 Root.register。 */
export function registerRule(entry: Rule): RuleHandle {
  return root.register(entry)
}

/**
 * 快照 CSSRoot 的源账本并生成 CSS string，不写 DOM；每次调用重新激活可达依赖，取值失败直接抛错。
 * @example
 * const handle = rule('.Button', 'color', 'red')
 * compileCSS() // 包含 '.Button {\ncolor: red;\n}'，无需 document。
 * handle.remove()
 */
export function compileCSS(): string {
  return root.compile()
}
