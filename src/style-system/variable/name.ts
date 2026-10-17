/** VariableName 是可独立传递的 CSS 自定义属性引用对象。
 *
 * 它将 --surface-color 这样的 CSS 名称与同名 Variable 定义连接起来；
 * 用作样式值时输出 var(--surface-color)，并激活关联定义。
 *
 * 因此可以先用 Name 编写依赖配方，再创建提供默认值和状态的 Variable。
 */
import { hasProperty, mapGet } from '@edsolater/fnkit'
import { createJSSContent, type JSSContent } from '../content'
import { allocateVariableName } from '../key'

/** 代表某个 CSS 名称的引用；自身不提供默认值或等级，具体定义由 Variable 提供。 */
export interface VariableName extends JSSContent {
  kind: 'variable-name'
}

/** 完整的 CSS 自定义属性名，例如 '--surface-color'；用于关联同名定义和声明，不包含 var(...)。 */
export type VariableNameAddress = string

/** 每个 Name 对象绑定的 CSS 名称；不同对象可以绑定同一名称。 */
const addresses = new WeakMap<VariableName, VariableNameAddress>()

/** 按 CSS 名称保存定义材料；不同 Name 对象只要同名，就能引用同一组定义。 */
const definitions = new Map<VariableNameAddress, Set<JSSContent>>()

/**
 * 为指定 CSS 名称创建引用对象，名称可带 -- 前缀；此时无需已有 Variable 定义，也不产生 CSS。
 * @example
 * const surfaceName = variableName('surface-color')
 * const surface = variable('white', { name: surfaceName })
 */
export function variableName(name: string): VariableName {
  const address: VariableNameAddress = `--${allocateVariableName(name).replace(/^--/, '')}`
  const self: VariableName = {
    kind: 'variable-name',
    /**
     * 输出 var(--名称)，并激活全部同名定义；没有 JSS 定义时仍输出引用，值可由 CSS 声明提供。
     */
    onCompile(context, controller) {
      controller.setContent(context, createJSSContent(() => `var(${address})`, [...definitions.get(address) ?? []]))
    },
  }
  addresses.set(self, address)
  return self
}

/**
 * 识别独立名称，不读取其关联定义。
 */
export const isVariableName = (input: unknown): input is VariableName =>
  hasProperty(input, 'kind', value => value === 'variable-name')

/**
 * 读取 Name 绑定的 CSS 自定义属性名，供声明键和按名称建立依赖关系使用。
 */
export const getVariableNameAddress = (name: VariableName): VariableNameAddress => addresses.get(name)!

/**
 * 将一个 Variable 的定义材料关联到 Name 的 CSS 名称，引用任一同名 Name 时便可激活该定义。
 * 同名定义全部保留，最终声明沿用原 priority 和顺序规则。
 */
export function bindVariableName(name: VariableName, content: JSSContent): void {
  mapGet(definitions, getVariableNameAddress(name), () => new Set<JSSContent>()).add(content)
}
