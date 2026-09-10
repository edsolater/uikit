/** 基于 CssBlock 将挂载内容放进 selector 的声明块。 */
import { cssBlock, type CssBlock } from '../css-block'

/** attach 后输出 selector 和花括号，不检查接入内容的业务合法性。 */
export function cssSelector(selector: string): CssBlock {
  return cssBlock(slot => slot.hasAttachment ? `${selector} { ${slot} }` : '')
}
