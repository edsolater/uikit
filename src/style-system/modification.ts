/** 可独立声明的变化描述。

保存领域参数，内置转译颜色配方，并提供声明与应用所需的内容材料。

变化与来源分别复用，绑定和条件应用由 Adjust、Modify 的使用端组织。
*/
import { and, assert, isFunction, isObject, isString, matchShape, type DataShape } from '@edsolater/fnkit'
import { createJSSContent, isJSSContent, type Expression, type JSSContent } from './content'
import { declareShape, type DeclareProtocol } from './declaration'
import { compileVariableContent } from './variable'
import { key } from './key'
import { allocateVariableName } from './variable-args-parser'
import { value, type ValueInput } from './value'

/** 变化自身的定义、声明与应用材料；没有来源绑定或运行时更新控制。 */
export interface Modification extends ModificationDefinition, ColorModificationContent, JSSContent {
  name: string
  /**
   * 返回自身 CSS 自定义属性名，供声明目标使用。
   */
  toCSSString(): string
}

/** 固定通道内容或当前通道表达式的变化；未指定通道保留来源。 */
export type ColorChannelModification = ValueInput | ((currentExpression: Expression) => Expression)

/** 一份 OKLCH 变化参数；回调在配方编译时收到 l/c/h/alpha 表达式。 */
export interface ColorModificationDetail {
  lightness?: ColorChannelModification
  chroma?: ColorChannelModification
  hue?: ColorChannelModification
  alpha?: ColorChannelModification
}

/** 颜色应用的材料；content 是独立配方，使用端负责引用它并组合来源。 */
export interface ColorModificationContent extends DeclareProtocol {
  type: 'color'
}

/** 颜色操作需要领域标识及可声明的源无关配方材料。 */
export const colorModificationShape = and(
  input => declareShape(input),
  input => matchShape(input, { type: type => type === 'color', key: key => {
    const name = key.toCSSString()
    return isString(name) && /^--.+/.test(name)
  } }),
) satisfies DataShape

/** 内置颜色转译的定义参数；Size 参数尚未定义，不接受未实现的内容领域。 */
export interface ModificationDefinition {
  type: 'color'
  name?: string
  detail: ColorModificationDetail
}

/**
 * 保存 type/detail，返回可独立声明和引用的 Modification；构造时不执行通道回调。
 * 固定值设定通道，相对回调由内置转译使用通道符号生成配方。
 * @example
 * const change = modification({ type: 'color', name: '--change', detail: { lightness: 0.3, chroma: x => add(x, 0.3) } })
 * declare(change) // --change: 0.3 calc(c + 0.3) h / alpha;
 * adjust(source, change) // 绑定来源、变化与新的结果 Variable。
 */
export function modification(definition: ModificationDefinition): Modification {
  assert(definition.type === 'color', `Modification 尚未支持内容领域：${definition.type}。`)
  assert(isObject(definition.detail), 'Modification 需要颜色 detail 材料。')
  assert(definition.name === undefined || (isString(definition.name) && /^--.+/.test(definition.name)), 'Modification name 需要完整 CSS 自定义属性名。')
  let name = definition.name === undefined ? `--${allocateVariableName()}` : allocateVariableName(definition.name)
  const recipe: JSSContent = {
    /**
     * 在消费时转译当前定义，提供与来源无关的 OKLCH 配方。
     */
    onCompile(context, controller) {
      const channels = Object.entries({
        l: self.detail.lightness, c: self.detail.chroma, h: self.detail.hue, alpha: self.detail.alpha,
      }).map(([symbol, change]) => change === undefined ? symbol : !isJSSContent(change) && isFunction(change) ? change(value(symbol)) : change)
      controller.setContent(context, createJSSContent(resolve => {
        const values = channels.map(resolve)
        return values.some(channel => channel === undefined) ? undefined
          : `${values[0]} ${values[1]} ${values[2]} / ${values[3]}`
      }, channels))
    },
  }
  const self: Modification = {
    ...definition,
    /**
     * 读取当前配方名称；声明与引用使用同一名称。
     */
    get name() { return name },
    /**
     * 登记新的显式配方名称，使后续匿名对象避让它。
     */
    set name(nextName) {
      assert(isString(nextName) && /^--.+/.test(nextName), 'Modification name 需要完整 CSS 自定义属性名。')
      name = allocateVariableName(nextName)
    },
    /**
     * 声明目标随当前完整 CSS 名称变化。
     */
    get key() { return key(self.name) },
    content: recipe,
    /**
     * 返回配方的声明目标名称。
     */
    toCSSString() { return self.name },
    /**
     * 普通消费提供配方引用；作为声明目标时保留属性名。
     */
    onCompile(context, controller) {
      compileVariableContent(self, context, controller)
    },
  }
  return self
}
