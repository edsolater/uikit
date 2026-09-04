import type { JSX } from 'solid-js'
import type { CssValue } from './css-value'

export function cssDeclarations(key: string, value: CssValue): CSSDeclarations {
  return {
    [key]: value,
  } as CSSDeclarations
} /** 一条 stylesheet rule 中的完整声明集合。 */

export type CSSDeclarations = {
  [key in keyof JSX.CSSProperties]: CssValue<JSX.CSSProperties[key]>
}
