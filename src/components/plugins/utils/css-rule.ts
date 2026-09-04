import type { CSSDeclarations } from './css-declararion'

export interface CSSRule {
  selector: string
  declarations: CSSDeclarations
}

/** 建立一条无副作用的 CSS 规则描述。 */
export function cssRule(selector: CssSelector, declarations: CSSDeclarations): CSSRule {
  return { selector, declarations }
}

export type CssSelector = string

export function cssSelector(selector: string): CssSelector {
  return selector
}
