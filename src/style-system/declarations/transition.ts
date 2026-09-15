/** 属性变化的过渡时间与缓动。 */
import { declaration, type Declaration } from '../core/css-declaration'
import { key } from '../core/css-key'
import { parseValue, type Value } from '../core/css-value'
import { parseTransition, type Transition } from '../values/transition'
import { formatCommaList } from '../formatters/comma-list'

export const transitionKey = key('transition')

/** 过渡属性声明；单项内容与声明身份独立。 */
export interface TransitionDeclaration extends Declaration<'transition', Transition[] | Value | string> {
  /** 追加完整过渡条目；只用于以条目列表构造的过渡，不拆解变量或关键字。 */
  append(...entries: Transition[]): this
}

/**
 * 直接配置属性、时长与缓动；节点保留条目，可继续追加。
 * @example
 * const feedback = transition(['color', '120ms', 'ease'])
 * feedback.append(['opacity', '120ms', 'linear'])
 * feedback.parseCss() // transition: color 120ms ease, opacity 120ms linear;
 */
export function transition(...entries: [Transition, ...Transition[]] | [Value | string]): TransitionDeclaration {
  const content = Array.isArray(entries[0]) ? entries as Transition[] : entries[0]
  return Object.assign(
    declaration(transitionKey, content, (content, context) => {
      if (!Array.isArray(content)) return parseValue(content, context)
      return formatCommaList(content, parseTransition, context)
    }),
    {
      append(this: TransitionDeclaration, ...entries: Transition[]) {
        if (!Array.isArray(this.content)) throw new TypeError('当前过渡不是条目列表；需要追加时，请在构造处传入过渡条目。')
        this.content.push(...entries)
        return this
      },
    },
  )
}
