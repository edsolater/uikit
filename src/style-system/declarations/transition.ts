/** 过渡声明只收集完整条目，编译器处理内部 Value。 */
import { declaration, type Declaration } from '../core/css-declaration'
import { key } from '../core/css-key'
import type { ValueInput } from '../core/css-value'
import type { Transition } from '../values/transition'

/** transition 声明的属性位置，也可作为其他 transition 条目的目标。 */
export const transitionKey = key('transition')

/** 可保存完整过渡 Value，或继续追加多个 Transition 条目的声明。 */
export interface TransitionDeclaration extends Declaration<'transition', Transition[] | ValueInput> {
  /** 原位追加过渡条目并返回当前声明；内容不是条目列表时抛出 TypeError。 */
  append(...entries: Transition[]): this
}

/**
 * 保存完整 Value 或各条过渡的属性、时长、缓动和延迟；只有条目列表支持 append。
 * @example
 * transition(['opacity', '100ms', 'ease']).append(['color', '200ms', 'linear'])
 * // 编译为 transition: opacity 100ms ease, color 200ms linear。
 * transition('none').append(['opacity', '100ms', 'ease']) // 抛错，完整 Value 不接受追加。
 */
export function transition(...entries: [Transition, ...Transition[]] | [ValueInput]): TransitionDeclaration {
  const content = Array.isArray(entries[0]) ? entries as Transition[] : entries[0]
  return Object.assign(declaration(transitionKey, content, 'transition'), {
    /** 追加完整过渡条目并返回自身；完整 Value 内容不接受追加，示例见 transition。 */
    append(this: TransitionDeclaration, ...entries: Transition[]) {
      if (!Array.isArray(this.content)) throw new TypeError('当前内容不是过渡列表；请在构造处传入完整条目。')
      this.content.push(...entries)
      return this
    },
  })
}
