/** 保存选择器及其子级关系，最终解析为样式规则。 */
import { block, type Block } from '../css-block'

/** 以选择器组织子级的 Block，规则标点不参与对象连接。 */
export interface Selector extends Block {
  kind: 'selector'
  selector: string
}

/** 创建可直接组合的选择器对象，不检查子级的业务合法性。
 * @example
 * const button = selector('.button').attach(property('color', value('blue')))
 */
export function selector(selector: string): Selector {
  return block({ kind: 'selector' as 'selector', selector }, {
    /** 依据选择器语义生成规则，空选择器体仍是空规则。 */
    parseCss() { return `${this.selector} { ${this.children.map(child => child.parseCss()).join('\n')} }` },
  })
}
