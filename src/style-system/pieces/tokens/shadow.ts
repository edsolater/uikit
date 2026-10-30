/** 阴影材料按几何尺度分档，模糊半径由单一长度基准提供。 */
import { whenDarkTheme } from '../conditions/environment'
import { shadowValue } from '../token-factory/shadow'
import { valueList } from '../token-factory/list'
import { token } from '../../token'
import { multiply } from '../functions/calc'
import { oklch } from '../functions/oklch'

/** 阴影与遮罩的根主题来源，不随消费处的局部地址移动。 */
export const shadowColor = token('rgb(0 0 0 / 4%)', {
  name: 'shadow-color',
  address: ':root',
  state: [
    [
      whenDarkTheme,
      (base) => oklch(base, { alpha: (current) => multiply(current, 38 / 4) }),
    ],
  ],
})
export const backdropColor = token('rgb(0 0 0 / 62%)', {
  name: 'backdrop-color',
  address: ':root',
  state: [
    [
      whenDarkTheme,
      (base) => oklch(base, { alpha: (current) => multiply(current, 72 / 62) }),
    ],
  ],
})

/** 所有阴影共用的几何长度基准；各层保持自身的位移与模糊比例。 */
export const shadowDistance = token('1px', {
  name: 'shadow-distance',
  address: ':root',
})

/** 小位移、短模糊的单层阴影。 */
export const baseShadowSmall = token(
  shadowValue({
    x: 0,
    y: shadowDistance,
    blur: multiply(shadowDistance, 2),
    color: shadowColor,
  }),
  {
    name: 'base-shadow-small',
    address: ':root',
    state: [
      [
        whenDarkTheme,
        shadowValue({
          x: 0,
          y: shadowDistance,
          blur: multiply(shadowDistance, 2),
          color: oklch(shadowColor, {
            alpha: (current) => multiply(current, 46 / 38),
          }),
        }),
      ],
    ],
  },
)
/** 两层阴影的基准档。 */
export const baseShadow = token(
  valueList(
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
  {
    name: 'base-shadow',
    address: ':root',
    state: [
      [
        whenDarkTheme,
        valueList(
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
      ],
    ],
  },
)

/** 比基准档更大位移与模糊范围的两层阴影。 */
export const baseShadowLarge = token(
  valueList(
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
  {
    name: 'base-shadow-large',
    address: ':root',
    state: [
      [
        whenDarkTheme,
        valueList(
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
      ],
    ],
  },
)

/** 更大位移与模糊范围的两层阴影。 */
export const baseShadowLarger = token(
  valueList(
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
  {
    name: 'base-shadow-larger',
    address: ':root',
    state: [
      [
        whenDarkTheme,
        valueList(
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
      ],
    ],
  },
)

/** 最大位移与模糊范围的两层阴影。 */
export const baseShadowLargest = token(
  valueList(
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
  {
    name: 'base-shadow-largest',
    address: ':root',
    state: [
      [
        whenDarkTheme,
        valueList(
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
      ],
    ],
  },
)

/** 消费处将此长度用于 blur()，较轻或较重的模糊直接相对它计算。 */
export const blurRadius = token('8px', {
  name: 'blur-radius',
  address: ':root',
})
