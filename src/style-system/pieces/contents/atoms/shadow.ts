/** 阴影按实际场景组合主题几何，模糊半径由单一长度基准提供。 */
import { shadowValue } from '../atom-creators/shadow'
import { valueList } from '../atom-creators/list'
import { token } from '../../../token'
import { multiply } from '../functions/calc'
import { oklch } from '../functions/oklch'

/** 阴影与遮罩的根主题来源，不随场景的局部地址移动。 */
export const shadowColor = token(
  {
    default: 'rgb(0 0 0 / 4%)',
    '&[data-theme="dark"]': (base) =>
      oklch(base, { alpha: (current) => multiply(current, 38 / 4) }),
  },
  'shadow-color',
)
export const backdropColor = token(
  {
    default: 'rgb(0 0 0 / 62%)',
    '&[data-theme="dark"]': (base) =>
      oklch(base, { alpha: (current) => multiply(current, 72 / 62) }),
  },
  'backdrop-color',
)

/** 所有场景共用的几何长度基准；各层保持自身的位移与模糊比例。 */
export const shadowDistance = token('1px', 'shadow-distance')

const cardShadowSource = token(
  {
    default: valueList(
      shadowValue({
        x: 0,
        y: shadowDistance,
        blur: multiply(shadowDistance, 2),
        color: oklch(shadowColor, {
          alpha: (current) => multiply(current, 3 / 4),
        }),
      }),
      shadowValue({
        x: 0,
        y: multiply(shadowDistance, 6),
        blur: multiply(shadowDistance, 18),
        color: shadowColor,
      }),
    ),
    '&[data-theme="dark"]': valueList(
      shadowValue({
        x: 0,
        y: shadowDistance,
        blur: multiply(shadowDistance, 2),
        color: oklch(shadowColor, {
          alpha: (current) => multiply(current, 46 / 38),
        }),
      }),
      shadowValue({
        x: 0,
        y: multiply(shadowDistance, 12),
        blur: multiply(shadowDistance, 28),
        color: shadowColor,
      }),
    ),
  },
  'card-shadow-source',
)

const popoverShadowSource = token(
  {
    default: valueList(
      shadowValue({
        x: 0,
        y: multiply(shadowDistance, 4),
        blur: multiply(shadowDistance, 8),
        color: shadowColor,
      }),
      shadowValue({
        x: 0,
        y: multiply(shadowDistance, 18),
        blur: multiply(shadowDistance, 40),
        color: shadowColor,
      }),
    ),
    '&[data-theme="dark"]': valueList(
      shadowValue({
        x: 0,
        y: multiply(shadowDistance, 4),
        blur: multiply(shadowDistance, 8),
        color: oklch(shadowColor, {
          alpha: (current) => multiply(current, 54 / 38),
        }),
      }),
      shadowValue({
        x: 0,
        y: multiply(shadowDistance, 24),
        blur: multiply(shadowDistance, 56),
        color: shadowColor,
      }),
    ),
  },
  'popover-shadow-source',
)

const dialogShadowSource = token(
  {
    default: valueList(
      shadowValue({
        x: 0,
        y: multiply(shadowDistance, 12),
        blur: multiply(shadowDistance, 24),
        color: shadowColor,
      }),
      shadowValue({
        x: 0,
        y: multiply(shadowDistance, 44),
        blur: multiply(shadowDistance, 88),
        color: shadowColor,
      }),
    ),
    '&[data-theme="dark"]': valueList(
      shadowValue({
        x: 0,
        y: multiply(shadowDistance, 12),
        blur: multiply(shadowDistance, 24),
        color: oklch(shadowColor, {
          alpha: (current) => multiply(current, 60 / 38),
        }),
      }),
      shadowValue({
        x: 0,
        y: multiply(shadowDistance, 52),
        blur: multiply(shadowDistance, 108),
        color: shadowColor,
      }),
    ),
  },
  'dialog-shadow-source',
)

const controlShadowSource = token(
  {
    default: shadowValue({
      x: 0,
      y: shadowDistance,
      blur: multiply(shadowDistance, 2),
      color: shadowColor,
    }),
    '&[data-theme="dark"]': shadowValue({
      x: 0,
      y: shadowDistance,
      blur: multiply(shadowDistance, 2),
      color: oklch(shadowColor, {
        alpha: (current) => multiply(current, 46 / 38),
      }),
    }),
  },
  'control-shadow-source',
)
const raisedCardShadowSource = token(
  {
    default: valueList(
      shadowValue({
        x: 0,
        y: multiply(shadowDistance, 2),
        blur: multiply(shadowDistance, 4),
        color: oklch(shadowColor, {
          alpha: (current) => multiply(current, 3.5 / 4),
        }),
      }),
      shadowValue({
        x: 0,
        y: multiply(shadowDistance, 10),
        blur: multiply(shadowDistance, 24),
        color: shadowColor,
      }),
    ),
    '&[data-theme="dark"]': valueList(
      shadowValue({
        x: 0,
        y: multiply(shadowDistance, 2),
        blur: multiply(shadowDistance, 4),
        color: oklch(shadowColor, {
          alpha: (current) => multiply(current, 50 / 38),
        }),
      }),
      shadowValue({
        x: 0,
        y: multiply(shadowDistance, 16),
        blur: multiply(shadowDistance, 36),
        color: shadowColor,
      }),
    ),
  },
  'raised-card-shadow-source',
)

/** 各场景有不同的多层几何；交互属于控制场景，主题条件始终留在根来源。 */
export const shadow = token(cardShadowSource, {
  name: 'shadow',
})

/**
 * 为具体场景创建独立 Token，交互状态留在场景定义，主题继续引用根来源。
 */
export function shadowFor(
  purpose: 'card' | 'popover' | 'dialog' | 'control' | 'filledControl',
) {
  if (purpose === 'card') return token(cardShadowSource, 'shadow-card')
  if (purpose === 'popover') return token(popoverShadowSource, 'shadow-popover')
  if (purpose === 'dialog') return token(dialogShadowSource, 'shadow-dialog')
  if (purpose === 'control')
    return token(
      {
        default: controlShadowSource,
        hover: cardShadowSource,
        active: 'none',
        disabled: 'none',
      },
      'shadow-control',
    )
  return token(
    {
      default: cardShadowSource,
      hover: raisedCardShadowSource,
      active: 'none',
      disabled: 'none',
    },
    'shadow-filled-control',
  )
}

/** 消费处将此长度用于 blur()，较轻或较重的模糊直接相对它计算。 */
export const blurRadius = token('8px', 'blur-radius')
