/** 公开 UIKit JSS 的 core 协议、基础变量与通用 atoms。 */
export { cssAtom, registerCssAtom, registerCssAtoms, type CssAtomFactory, type CssAtomRegistry } from './atoms/css-atom'
export { cssBaseVariable, cssColor } from './tokens/color'
export { cssBoundary, cssSize, cssSpace } from './tokens/dimension'
export { cssShadow } from './tokens/elevation'
export { cssMotion } from './tokens/motion'
export { cssFontSize } from './tokens/typography'
export { createCssBlock, type CssBlock } from './core/css-block'
export { atRule, selector, stylesheet, type CssBox, type CssBoxContent } from './core/css-box'
export { cssColorMix, type CssColor, type CssWeightedColor } from './core/css-color'
export { cssDeclaration, type CssDeclaration } from './core/css-declaration'
export { cssKey, type CssKey } from './core/css-key'
export { mountCssStylesheet } from './core/css-stylesheet'
export { parseCssStylesheet } from './core/parse-css-stylesheet'
export { parseCssValue } from './core/parse-css-value'
export {
  cssValue,
  cssValueSequence,
  isCssValue,
  joinCssValues,
  type CssRawValue,
  type CssValue,
  type CssValueContent,
  type CssValueSource,
} from './core/css-value'
export {
  withCssValueActivation,
  type CssValueActivation,
  type CssValueActivationContext,
} from './core/css-value-activation'
export {
  cssVariable,
  type CssVariable,
  type CssVariableDeclarationValue,
  type CssVariableOptions,
  type CssVariableProperty,
  type CssVariableStateValues,
} from './core/css-variable'
