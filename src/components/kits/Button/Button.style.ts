/** 用通用 atoms 与智能 tokens 组合 Button 的尺寸、语气和交互样式。 */
import {
  cssAtom,
  cssBaseVariable,
  cssBoundary,
  cssColor,
  cssColorMix,
  cssFontSize,
  cssMotion,
  cssShadow,
  cssSize,
  cssSpace,
  cssVariable,
  cssValueSequence,
  joinCssValues,
  mountCssStylesheet,
  selector,
  stylesheet,
  type CssBoxContent,
} from '../../../jss'

type ButtonTone = 'accent' | 'danger'
type ButtonSize = 'small' | 'large' | 'xlarge'

export const buttonStyleUrl = import.meta.url

const buttonVariable = {
  border: cssVariable('button-border', { fallback: cssColorMix([cssColor.line, 0.72], 'transparent') }),
  shadow: cssVariable('button-shadow', {
    value: { default: cssShadow.low, hover: cssShadow.raised, active: cssShadow.flat },
  }),
  minHeight: cssVariable('button-min-height', { fallback: cssSize.normal }),
  paddingX: cssVariable('button-padding-x', { fallback: cssSpace.xlarge }),
  paddingY: cssVariable('button-padding-y', { fallback: cssSpace.normal }),
  gap: cssVariable('button-gap', { fallback: cssSpace.normal }),
  fontSize: cssVariable('button-font-size', { fallback: cssFontSize.large }),
  focus: cssVariable('button-focus', { fallback: cssColor.accentFocus }),
}

const transition = joinCssValues(
  ', ',
  ...['background-color', 'border-color', 'box-shadow', 'color', 'opacity', 'transform'].map((property) =>
    joinCssValues(' ', property, cssMotion.fast, cssMotion.standard),
  ),
)

/** 取得强调或危险语气；智能变量承担默认和状态颜色派生。 */
function toneContent(tone: ButtonTone): CssBoxContent[] {
  const color = tone === 'danger' ? cssColor.bad : cssColor.accent
  const soft = tone === 'danger' ? cssColor.badSoft : cssColor.accentSoft
  const foreground = tone === 'danger' ? cssColor.badFg : cssColor.accentFg
  const background = cssVariable('button-' + tone + '-background', {
    value: {
      default: cssColorMix([cssColor.surface, 0.76], soft),
      hover: cssColorMix([cssColor.surface, 0.66], soft),
      active: cssColorMix([cssColor.surface, 0.56], soft),
    },
  })
  const text = cssVariable('button-' + tone + '-foreground', {
    value: { default: color, hover: foreground, active: foreground },
  })
  return [
    buttonVariable.focus.declaration(tone === 'danger' ? cssColor.badLine : cssColor.accentFocus),
    cssAtom.backgroundColor(background),
    cssAtom.border(joinCssValues(' ', cssBoundary.thin, 'solid', soft)),
    cssAtom.color(text),
  ]
}

/** 取得一组尺寸覆盖，字段表达每项物理尺寸的用途。 */
function sizeContent(size: ButtonSize): CssBoxContent[] {
  const sizes = {
    small: {
      height: cssSize.small,
      x: cssSpace.medium,
      y: cssSpace.small,
      gap: cssSpace.small,
      font: cssFontSize.normal,
    },
    large: {
      height: cssSize.large,
      x: cssSpace.wide,
      y: cssSpace.normal,
      gap: cssSpace.medium,
      font: cssFontSize.xlarge,
    },
    xlarge: {
      height: cssSize.xlarge,
      x: cssSpace.widest,
      y: cssSpace.medium,
      gap: cssSpace.large,
      font: cssFontSize.heading,
    },
  }[size]
  return [
    buttonVariable.minHeight.declaration(sizes.height),
    buttonVariable.paddingX.declaration(sizes.x),
    buttonVariable.paddingY.declaration(sizes.y),
    buttonVariable.gap.declaration(sizes.gap),
    buttonVariable.fontSize.declaration(sizes.font),
  ]
}

// 默认按钮消费全局智能背景和前景，不写局部值覆盖其状态配方。
const base = selector(
  '.Button',
  cssAtom.inlineFlex(),
  cssAtom.alignItems('center'),
  cssAtom.alignSelf('center'),
  cssAtom.justifyContent('center'),
  cssAtom.gap(buttonVariable.gap),
  cssAtom.minHeight(buttonVariable.minHeight),
  cssAtom.padding(joinCssValues(' ', buttonVariable.paddingY, buttonVariable.paddingX)),
  cssAtom.border(joinCssValues(' ', cssBoundary.thin, 'solid', buttonVariable.border)),
  cssAtom.borderRadius('999px'),
  cssAtom.backgroundColor(cssBaseVariable.bg),
  cssAtom.boxShadow(buttonVariable.shadow),
  cssAtom.color(cssBaseVariable.fg),
  cssAtom.font('inherit'),
  cssAtom.fontSize(buttonVariable.fontSize),
  cssAtom.fontWeight(700),
  cssAtom.lineHeight(1),
  cssAtom.cursor('pointer'),
  cssAtom.userSelect('none'),
  cssAtom.transition(transition),
)

const buttonStylesheet = stylesheet(
  base,
  selector(
    '.Button:where(:active):not(:disabled)',
    cssAtom.transform(cssValueSequence('translateY(', cssBoundary.thin, ')')),
  ),
  selector('.Button:focus-visible', cssAtom.focusRing(buttonVariable.focus)),

  // bare 让动作退出视觉焦点，有意覆盖默认背景与阴影。
  selector(
    ".Button[data-variant='bare']",
    cssAtom.backgroundColor('transparent'),
    cssAtom.border(joinCssValues(' ', cssBoundary.thin, 'solid', 'transparent')),
    cssAtom.boxShadow('none'),
  ),
  selector(
    ".Button[data-variant='bare']:where(:hover):not(:disabled)",
    cssAtom.backgroundColor(cssColorMix([cssColor.fg, 0.08], 'transparent')),
  ),
  selector(
    ".Button[data-variant='bare']:where(:active):not(:disabled)",
    cssAtom.backgroundColor(cssColorMix([cssColor.fg, 0.14], 'transparent')),
  ),

  // solid 采用智能动作色，状态变化由 token 定义端提供。
  selector(
    ".Button[data-variant='solid']",
    cssAtom.backgroundColor(cssBaseVariable.action),
    cssAtom.border(joinCssValues(' ', cssBoundary.thin, 'solid', 'transparent')),
    cssAtom.boxShadow(cssShadow.raised),
    cssAtom.color(cssColor.actionFg),
  ),
  selector(".Button[data-tone='accent']", ...toneContent('accent')),
  selector(".Button[data-tone='danger']", ...toneContent('danger')),
  selector(".Button[data-variant='solid'][data-tone]", cssAtom.color(cssColor.actionFg)),
  selector(".Button[data-size='small']", ...sizeContent('small')),
  selector(".Button[data-size='large']", ...sizeContent('large')),
  selector(".Button[data-size='xlarge']", ...sizeContent('xlarge')),
  selector(".Button[data-status~='loading']", cssAtom.cursor('progress')),
  selector(
    ".Button:disabled,\n.Button[data-status~='disabled']",
    cssAtom.backgroundColor(cssColor.surface),
    cssAtom.color(cssColor.fg),
    cssAtom.boxShadow('none'),
    cssAtom.cursor('not-allowed'),
    cssAtom.opacity(0.48),
    cssAtom.transform('none'),
  ),
)

/** 在 Button 真正执行时连接活根；模块加载只构建对象。 */
export function registerButtonStyle(): void {
  if (typeof document === 'undefined') return
  mountCssStylesheet(document, buttonStyleUrl, buttonStylesheet)
}
