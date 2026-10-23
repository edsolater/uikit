/** CSS名称引用对象；字符串化用于命名组合，内容消费只输出CSS引用，不激活Variable定义。 */
import { hasProperty } from '@edsolater/fnkit'
import { createJSSContent, type JSSContent } from '../content'
import { allocateVariableName } from '../custom-property-names'

/** 代表某个 CSS 名称的引用；自身不提供默认值或等级，具体定义由 Variable 提供。 */
export interface VariableName extends JSSContent {
  kind: 'variable-name'
  toString(): string
  [Symbol.toPrimitive](): string
}

/** 完整的 CSS 自定义属性名，例如 '--surface-color'；用于声明地址，不包含 var(...)。 */
export type VariableNameAddress = string

/** 每个 Name 对象绑定的 CSS 名称；不同对象可以绑定同一名称。 */
const addresses = new WeakMap<VariableName, VariableNameAddress>()

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
    toString: () => address.slice(2),
    [Symbol.toPrimitive]: () => address.slice(2),
    /**
     * 输出 var(--名称)，不查找或激活同名定义；值由实际 CSS 声明提供。
     */
    onCompile(context, controller) {
      controller.setContent(context, createJSSContent(() => `var(${address})`))
    },
  }
  addresses.set(self, address)
  return self
}

/**
 * 识别独立名称对象，不查找Variable定义。
 */
export const isVariableName = (input: unknown): input is VariableName =>
  hasProperty(input, 'kind', value => value === 'variable-name')

/**
 * 读取Name绑定的完整CSS地址，供声明键与引用输出使用。
 */
export const getVariableNameAddress = (name: VariableName): VariableNameAddress => addresses.get(name)!
