/** 盒阴影声明保留完整阴影列表或单个值。 */
import { declaration, type Declaration } from '../core/css-declaration'
import { key } from '../core/css-key'
import type { ValueInput } from '../core/css-value'
import type { Shadow } from '../values/shadow'

/** box-shadow 声明的属性位置，可供 Rule 或过渡条目引用。 */
export const boxShadowKey = key('box-shadow')

/** 可保存完整阴影 Value，或继续追加多层 Shadow 的声明。 */
export interface BoxShadowDeclaration extends Declaration<'box-shadow', Shadow[] | ValueInput> {
  /** 原位追加阴影并返回当前声明；内容不是阴影列表时抛出 TypeError。 */
  append(...shadows: Shadow[]): this
}

/**
 * 保存一个完整 Value 或多条 Shadow；只有按 Shadow 列表构造的声明支持 append，不提前编译。
 * @example
 * const first = shadowValue({ x: '0', y: '1px', color: 'black' })
 * const next = shadowValue({ x: '0', y: '2px', color: 'gray' })
 * boxShadow(first).append(next) // 编译为 box-shadow: 0 1px black, 0 2px gray。
 * boxShadow('none').append(first) // 抛错，完整 Value 不是可追加的阴影列表。
 */
export function boxShadow(...inputs: [ValueInput] | [Shadow, ...Shadow[]]): BoxShadowDeclaration {
  const first = inputs[0]
  const content = typeof first === 'object' && !(first instanceof Map) && first.expression?.type === 'shadow' ? inputs as Shadow[] : first
  return Object.assign(declaration(boxShadowKey, content, 'box-shadow'), {
    /** 追加到当前阴影列表并返回自身；完整 Value 内容不接受追加，示例见 boxShadow。 */
    append(this: BoxShadowDeclaration, ...shadows: Shadow[]) {
      if (!Array.isArray(this.content)) throw new TypeError('当前内容不是阴影列表；请在构造处传入各条阴影。')
      this.content.push(...shadows)
      return this
    },
  })
}
