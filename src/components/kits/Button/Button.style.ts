/**
 * 定义、组合并在 Button 真实执行时挂载它的完整样式。
 * Button 只组合通用 CSS 原子，不向 cssBlocks registry 注册组件业务片段。
 */
import {
  atRuleBox,
  cssBlocks,
  cssColorMix,
  cssValueSequence,
  cssVariable,
  joinCssValues,
  mountCssStylesheet,
  selectorBox,
  stylesheetBox,
  type CssBlock,
  type CssBox,
} from '../../../style-utils'

type ButtonTone = 'accent' | 'danger'
type ButtonSize = 'small' | 'large' | 'xlarge'

export const buttonStyleURL = import.meta.url

const tokens = {
  colorSurface: cssVariable('color-surface'),
  colorAction: cssVariable('color-action'),
  colorActionHover: cssVariable('color-action-hover'),
  colorActionActive: cssVariable('color-action-active'),
  colorActionForeground: cssVariable('color-action-fg'),
  colorForeground: cssVariable('color-fg'),
  colorForegroundStrong: cssVariable('color-fg-strong'),
  colorLine: cssVariable('color-line'),
  colorAccent: cssVariable('color-accent'),
  colorAccentSoft: cssVariable('color-accent-soft'),
  colorAccentForeground: cssVariable('color-accent-fg'),
  colorAccentFocus: cssVariable('color-accent-focus'),
  colorBad: cssVariable('color-bad'),
  colorBadSoft: cssVariable('color-bad-soft'),
  colorBadForeground: cssVariable('color-bad-fg'),
  colorBadLine: cssVariable('color-bad-line'),
  shadow0: cssVariable('shadow-0'),
  shadow1: cssVariable('shadow-1'),
  shadow2: cssVariable('shadow-2'),
  shadow3: cssVariable('shadow-3'),
  boundary1: cssVariable('boundary-1'),
  size3: cssVariable('size-3'),
  size5: cssVariable('size-5'),
  size7: cssVariable('size-7'),
  size8: cssVariable('size-8'),
  space2: cssVariable('space-2'),
  space3: cssVariable('space-3'),
  space4: cssVariable('space-4'),
  space5: cssVariable('space-5'),
  space6: cssVariable('space-6'),
  space7: cssVariable('space-7'),
  space8: cssVariable('space-8'),
  fontSizeMd: cssVariable('font-size-md'),
  fontSizeLg: cssVariable('font-size-lg'),
  fontSizeXl: cssVariable('font-size-xl'),
  fontSize2xl: cssVariable('font-size-2xl'),
  motionDurationFast: cssVariable('motion-duration-fast'),
  motionEaseStandard: cssVariable('motion-ease-standard'),
}

const variables = {
  background: cssVariable('button-bg'),
  backgroundHover: cssVariable('button-bg-hover'),
  backgroundActive: cssVariable('button-bg-active'),
  foreground: cssVariable('button-fg'),
  foregroundHover: cssVariable('button-fg-hover'),
  border: cssVariable('button-border'),
  shadow: cssVariable('button-shadow'),
  shadowHover: cssVariable('button-shadow-hover'),
  shadowActive: cssVariable('button-shadow-active'),
  minHeight: cssVariable('button-min-height'),
  paddingX: cssVariable('button-padding-x'),
  paddingY: cssVariable('button-padding-y'),
  gap: cssVariable('button-gap'),
  fontSize: cssVariable('button-font-size'),
  tone: cssVariable('button-tone'),
  toneSoft: cssVariable('button-tone-soft'),
  toneForeground: cssVariable('button-tone-fg'),
  focus: cssVariable('button-focus', { fallback: tokens.colorAccentFocus }),
}

const composites = {
  padding: joinCssValues(' ', variables.paddingY, variables.paddingX),
  border: joinCssValues(' ', tokens.boundary1, 'solid', variables.border),
  activeTransform: cssValueSequence('translateY(', tokens.boundary1, ')'),
  transition: joinCssValues(
    ', ',
    joinCssValues(' ', 'background-color', tokens.motionDurationFast, tokens.motionEaseStandard),
    joinCssValues(' ', 'border-color', tokens.motionDurationFast, tokens.motionEaseStandard),
    joinCssValues(' ', 'box-shadow', tokens.motionDurationFast, tokens.motionEaseStandard),
    joinCssValues(' ', 'color', tokens.motionDurationFast, tokens.motionEaseStandard),
    joinCssValues(' ', 'opacity', tokens.motionDurationFast, tokens.motionEaseStandard),
    joinCssValues(' ', 'transform', tokens.motionDurationFast, tokens.motionEaseStandard),
  ),
  defaultBackground: cssColorMix([tokens.colorSurface, 0.9], tokens.colorAction),
  defaultBackgroundHover: cssColorMix([tokens.colorSurface, 0.82], tokens.colorAction),
  defaultBackgroundActive: cssColorMix([tokens.colorSurface, 0.74], tokens.colorAction),
  defaultBorder: cssColorMix([tokens.colorLine, 0.72], 'transparent'),
}

// 低权重动作退出视觉焦点；数组只保存 Button 的业务组合，不形成新的 CssBlock。
const bareBlocks = [
  cssBlocks.customProperty(variables.background, 'transparent'),
  cssBlocks.customProperty(
    variables.backgroundHover,
    cssColorMix([tokens.colorForeground, 0.08], 'transparent'),
  ),
  cssBlocks.customProperty(
    variables.backgroundActive,
    cssColorMix([tokens.colorForeground, 0.14], 'transparent'),
  ),
  cssBlocks.customProperty(variables.border, 'transparent'),
  cssBlocks.customProperty(variables.shadow, 'none'),
  cssBlocks.customProperty(variables.shadowHover, 'none'),
  cssBlocks.customProperty(variables.shadowActive, 'none'),
]

// 实色表面表达需要优先被看到的动作。
const solidBlocks = [
  cssBlocks.customProperty(variables.background, tokens.colorAction),
  cssBlocks.customProperty(variables.backgroundHover, tokens.colorActionHover),
  cssBlocks.customProperty(variables.backgroundActive, tokens.colorActionActive),
  cssBlocks.customProperty(variables.foreground, tokens.colorActionForeground),
  cssBlocks.customProperty(variables.foregroundHover, tokens.colorActionForeground),
  cssBlocks.customProperty(variables.border, 'transparent'),
  cssBlocks.customProperty(variables.shadow, tokens.shadow2),
  cssBlocks.customProperty(variables.shadowHover, tokens.shadow3),
  cssBlocks.customProperty(variables.shadowActive, tokens.shadow0),
]

// solid 与 tone 同时出现时，tone 决定实色表面。
const solidToneBlocks = [
  cssBlocks.customProperty(variables.background, variables.tone),
  cssBlocks.customProperty(
    variables.backgroundHover,
    cssColorMix([variables.tone, 0.88], tokens.colorForegroundStrong),
  ),
  cssBlocks.customProperty(
    variables.backgroundActive,
    cssColorMix([variables.tone, 0.78], tokens.colorForegroundStrong),
  ),
  cssBlocks.customProperty(variables.foreground, variables.toneForeground),
  cssBlocks.customProperty(variables.foregroundHover, variables.toneForeground),
]

let buttonStylesheet: CssBox | undefined

/** 把动作语气选择翻译成一组通用 declaration blocks。 */
function createToneBlocks(tone: ButtonTone): CssBlock[] {
  const toneColor = tone === 'danger' ? tokens.colorBad : tokens.colorAccent
  const softColor = tone === 'danger' ? tokens.colorBadSoft : tokens.colorAccentSoft
  const foreground = tone === 'danger' ? tokens.colorBadForeground : tokens.colorAccentForeground
  const focus = tone === 'danger' ? tokens.colorBadLine : tokens.colorAccentFocus

  return [
    cssBlocks.customProperty(variables.tone, toneColor),
    cssBlocks.customProperty(variables.toneSoft, softColor),
    cssBlocks.customProperty(variables.toneForeground, foreground),
    cssBlocks.customProperty(
      variables.background,
      cssColorMix([tokens.colorSurface, 0.76], variables.toneSoft),
    ),
    cssBlocks.customProperty(
      variables.backgroundHover,
      cssColorMix([tokens.colorSurface, 0.66], variables.toneSoft),
    ),
    cssBlocks.customProperty(
      variables.backgroundActive,
      cssColorMix([tokens.colorSurface, 0.56], variables.toneSoft),
    ),
    cssBlocks.customProperty(variables.foreground, variables.tone),
    cssBlocks.customProperty(variables.foregroundHover, variables.tone),
    cssBlocks.customProperty(variables.focus, focus),
  ]
}

/** 把物理尺寸选择翻译成一组通用 custom property blocks。 */
function createSizeBlocks(size: ButtonSize): CssBlock[] {
  const sizeValuesBySize = {
    small: [tokens.size3, tokens.space4, tokens.space2, tokens.space2, tokens.fontSizeMd],
    large: [tokens.size7, tokens.space7, tokens.space3, tokens.space4, tokens.fontSizeXl],
    xlarge: [tokens.size8, tokens.space8, tokens.space4, tokens.space5, tokens.fontSize2xl],
  }[size]

  return [
    cssBlocks.customProperty(variables.minHeight, sizeValuesBySize[0]),
    cssBlocks.customProperty(variables.paddingX, sizeValuesBySize[1]),
    cssBlocks.customProperty(variables.paddingY, sizeValuesBySize[2]),
    cssBlocks.customProperty(variables.gap, sizeValuesBySize[3]),
    cssBlocks.customProperty(variables.fontSize, sizeValuesBySize[4]),
  ]
}

/** 延迟建立 Button 根 box，使首次使用前完成的原子 block 覆盖能够进入结果。 */
function getButtonStylesheet(): CssBox {
  if (buttonStylesheet) return buttonStylesheet

  buttonStylesheet = stylesheetBox(
    atRuleBox(
      '@layer uikit',
      selectorBox(
        '.Button',
        cssBlocks.customProperty(variables.background, composites.defaultBackground),
        cssBlocks.customProperty(variables.backgroundHover, composites.defaultBackgroundHover),
        cssBlocks.customProperty(variables.backgroundActive, composites.defaultBackgroundActive),
        cssBlocks.customProperty(variables.foreground, tokens.colorForegroundStrong),
        cssBlocks.customProperty(variables.foregroundHover, tokens.colorForegroundStrong),
        cssBlocks.customProperty(variables.border, composites.defaultBorder),
        cssBlocks.customProperty(variables.shadow, tokens.shadow1),
        cssBlocks.customProperty(variables.shadowHover, tokens.shadow2),
        cssBlocks.customProperty(variables.shadowActive, tokens.shadow0),
        cssBlocks.customProperty(variables.minHeight, tokens.size5),
        cssBlocks.customProperty(variables.paddingX, tokens.space6),
        cssBlocks.customProperty(variables.paddingY, tokens.space3),
        cssBlocks.customProperty(variables.gap, tokens.space3),
        cssBlocks.customProperty(variables.fontSize, tokens.fontSizeLg),
        cssBlocks.inlineFlex(),
        cssBlocks.alignItems('center'),
        cssBlocks.alignSelf('center'),
        cssBlocks.justifyContent('center'),
        cssBlocks.gap(variables.gap),
        cssBlocks.minHeight(variables.minHeight),
        cssBlocks.padding(composites.padding),
        cssBlocks.border(composites.border),
        cssBlocks.borderRadius('999px'),
        cssBlocks.backgroundColor(variables.background),
        cssBlocks.boxShadow(variables.shadow),
        cssBlocks.color(variables.foreground),
        cssBlocks.font('inherit'),
        cssBlocks.fontSize(variables.fontSize),
        cssBlocks.fontWeight(700),
        cssBlocks.lineHeight(1),
        cssBlocks.cursor('pointer'),
        cssBlocks.userSelect('none'),
        cssBlocks.transition(composites.transition),
      ),
      selectorBox(
        '.Button:hover:not(:disabled)',
        cssBlocks.backgroundColor(variables.backgroundHover),
        cssBlocks.boxShadow(variables.shadowHover),
        cssBlocks.color(variables.foregroundHover),
      ),
      selectorBox(
        '.Button:active:not(:disabled)',
        cssBlocks.backgroundColor(variables.backgroundActive),
        cssBlocks.boxShadow(variables.shadowActive),
        cssBlocks.transform(composites.activeTransform),
      ),
      selectorBox('.Button:focus-visible', cssBlocks.focusRing(variables.focus)),
      selectorBox(".Button[data-variant='bare']", ...bareBlocks),
      selectorBox(".Button[data-variant='solid']", ...solidBlocks),
      selectorBox(".Button[data-tone='accent']", ...createToneBlocks('accent')),
      selectorBox(".Button[data-tone='danger']", ...createToneBlocks('danger')),
      selectorBox(".Button[data-variant='bare'][data-tone]", ...bareBlocks),
      selectorBox(".Button[data-variant='solid'][data-tone]", ...solidToneBlocks),
      selectorBox(".Button[data-size='small']", ...createSizeBlocks('small')),
      selectorBox(".Button[data-size='large']", ...createSizeBlocks('large')),
      selectorBox(".Button[data-size='xlarge']", ...createSizeBlocks('xlarge')),
      selectorBox(".Button[data-status~='loading']", cssBlocks.cursor('progress')),
      selectorBox(
        ".Button:disabled,\n.Button[data-status~='disabled']",
        cssBlocks.boxShadow('none'),
        cssBlocks.cursor('not-allowed'),
        cssBlocks.opacity(0.48),
        cssBlocks.transform('none'),
      ),
    ),
  )
  return buttonStylesheet
}

/** 在 Button 真实执行时激活样式；SSR 跳过，同一 Document 中保持单份。 */
export function registerButtonStyle(): void {
  if (typeof document === 'undefined') return
  mountCssStylesheet(document, buttonStyleURL, getButtonStylesheet())
}
