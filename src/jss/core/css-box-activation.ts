/** 沿 CssBox、CssBlock、declaration 与 value 的对象关系传播激活。 */
import { isCssBlock, readCssBlock } from './css-block'
import { activateCssBox, type CssBoxActivation, type CssBoxContent } from './css-box'
import { isCssDeclaration, readCssDeclaration } from './css-declaration'
import { activateCssValue, activateCssValueContent } from './css-value-activation'

/** 激活一个已经挂靠到活 Box 的内容结果。 */
export function activateCssBoxContent(content: CssBoxContent, activation: CssBoxActivation): void {
  if (isCssBlock(content)) {
    activateCssBox(readCssBlock(content), activation)
    return
  }
  if (isCssDeclaration(content)) {
    const declaration = readCssDeclaration(content)
    for (const dependency of declaration.dependencies) activateCssValue(dependency, activation.document)
    activateCssValueContent(declaration.value, activation.document)
    return
  }
  activateCssBox(content, activation)
}
