/** 用途颜色保存元素状态，根主题来源保持原地址。 */
import { token } from '../../../token'
import { stateCondition } from '../../../state-condition'
import { oklch } from '../../functions/oklch'
import { add, multiply } from '../../functions/calc'
import {
  whenHover,
  whenActive,
  whenDisabled,
} from '../../conditions/interaction'
import { colorMix } from '../../functions/color-mix'
import {
  brandColorTheme,
  accentColorTheme,
  goodColorTheme,
  badColorTheme,
  warnColorTheme,
  infoColorTheme,
  canvasColorTheme,
  surfaceColorTheme,
  contentColorTheme,
  boundaryColorTheme,
  inkColorTheme,
} from './seeds'

const soft = stateCondition('&:where([data-emphasis="soft"])')
const strong = stateCondition('&:where([data-emphasis="strong"])')

/** 品牌及反馈颜色只表达强调程度，交互反馈由动作颜色拥有。 */
export const brandColorEmphasis = token(brandColorTheme, {
  name: 'brand-color-emphasis',
  address: undefined,
  state: [
    [
      soft,
      (base) => oklch(base, { alpha: (current) => multiply(current, 0.14) }),
    ],
    [
      strong,
      (base) =>
        oklch(base, {
          lightness: (current) => add(current, 0.08),
          chroma: (current) => add(current, 0.02),
        }),
    ],
  ],
})

/** 动作的强调、交互和禁用各自独立匹配。 */
export const actionColor = token(brandColorTheme, {
  name: 'action-color',
  address: undefined,
  state: [
    ...(brandColorEmphasis.state ?? []),
    [
      whenHover,
      (base) =>
        oklch(base, {
          lightness: (current) => add(current, -0.04),
          chroma: (current) => add(current, 0.01),
        }),
    ],
    [
      whenActive,
      (base) =>
        oklch(base, {
          lightness: (current) => add(current, -0.08),
          chroma: (current) => add(current, -0.01),
        }),
    ],
    [
      whenDisabled,
      (base) =>
        oklch(base, {
          alpha: (current) => multiply(current, 0.48),
        }),
    ],
  ],
})
export const accentColorEmphasis = token(accentColorTheme, {
  name: 'accent-color-emphasis',
  address: undefined,
  state: brandColorEmphasis.state,
})
export const goodColorEmphasis = token(goodColorTheme, {
  name: 'good-color-emphasis',
  address: undefined,
  state: brandColorEmphasis.state,
})
export const badColorEmphasis = token(badColorTheme, {
  name: 'bad-color-emphasis',
  address: undefined,
  state: brandColorEmphasis.state,
})
export const warnColorEmphasis = token(warnColorTheme, {
  name: 'warn-color-emphasis',
  address: undefined,
  state: brandColorEmphasis.state,
})
export const infoColorEmphasis = token(infoColorTheme, {
  name: 'info-color-emphasis',
  address: undefined,
  state: brandColorEmphasis.state,
})
export const linkColor = token(brandColorTheme, {
  name: 'link-color',
  address: undefined,
  state: [
    ...(actionColor.state ?? []),
    [
      stateCondition('&:where(:visited)'),
      (base) =>
        oklch(base, {
          hue: (current) => add(current, 36),
          chroma: (current) => add(current, -0.02),
        }),
    ],
  ],
})

/** 画布本身就是根主题来源；局部元素只需引用，不重定位其主题条件。 */
export const canvasColor = canvasColorTheme

/** 中性区域的强调保留各自用途；主题仍由根来源负责。 */
export const surfaceColorEmphasis = token(surfaceColorTheme, {
  name: 'surface-color-emphasis',
  address: undefined,
  state: [
    [soft, (base) => colorMix([base, 0.5], [canvasColorTheme, 0.5])],
    [strong, (base) => colorMix([base, 0.9], [inkColorTheme, 0.1])],
  ],
})
export const contentColorEmphasis = token(contentColorTheme, {
  name: 'content-color-emphasis',
  address: undefined,
  state: [
    [soft, (base) => colorMix([base, 0.7], [surfaceColorTheme, 0.3])],
    [strong, (base) => colorMix([base, 0.4], [inkColorTheme, 0.6])],
  ],
})
export const boundaryColorEmphasis = token(boundaryColorTheme, {
  name: 'boundary-color-emphasis',
  address: undefined,
  state: [
    [
      soft,
      (base) => oklch(base, { alpha: (current) => multiply(current, 0.5) }),
    ],
    [
      strong,
      (base) => oklch(base, { alpha: (current) => multiply(current, 1.6) }),
    ],
  ],
})
