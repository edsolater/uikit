/** 公开 UIKit JSS 工具定义端的稳定契约。 */
export {
  createCssBlock,
  cssBlocks,
  registerCssBlock,
  registerCssBlocks,
  type CssBlock,
  type CssBlockFactory,
  type CssBlocksRegistry,
} from './core/css-block'
export {
  atRuleBox,
  cssBox,
  selectorBox,
  stylesheetBox,
  type CssBox,
  type CssBoxContent,
  type CssDeclarations,
} from './core/css-box'
export { cssColorMix, type CssColor, type CssWeightedColor } from './core/css-color'
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
export { cssVariable, type CssVariable, type CssVariableOptions, type CssVariableProperty } from './core/css-variable'
