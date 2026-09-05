/** 为语义材料保存默认、主题和媒体配方，在首次消费时挂载。 */
import { atRule, selector, stylesheet } from '../core/css-box'
import { cssDeclaration } from '../core/css-declaration'
import { mountCssStylesheet } from '../core/css-stylesheet'
import { type CssValueContent } from '../core/css-value'
import { withCssValueActivation } from '../core/css-value-activation'
import { cssVariable, type CssVariable } from '../core/css-variable'

interface TokenOptions {
  dark?: CssValueContent
  reducedMotion?: CssValueContent
}

/**
 * 取得可局部覆盖的 token；配方保持对象，主题判断交给 CSS。
 *
 * @example
 * const surface = token('color-surface', 'white', { dark: 'black' })
 */
export function token(name: string, value: CssValueContent, options: TokenOptions = {}): CssVariable {
  const variable = cssVariable(name)
  const root = stylesheet(selector(':where(:root)', cssDeclaration(variable.name, value)))
  if (options.dark !== undefined) {
    root.attach(selector(':where(:root[data-theme="dark"])', cssDeclaration(variable.name, options.dark)))
  }
  if (options.reducedMotion !== undefined) {
    root.attach(
      atRule(
        '@media (prefers-reduced-motion: reduce)',
        selector(':where(:root)', cssDeclaration(variable.name, options.reducedMotion)),
      ),
    )
  }
  withCssValueActivation(variable, ({ document }) => mountCssStylesheet(document, 'token:' + name, root))
  return variable
}
