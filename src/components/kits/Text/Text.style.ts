/** 定位框开启时只隐藏文字像素，文字继续排版与更新。 */
import {
  rules,
  token,
  stateCondition,
  contentColorTheme,
  surfaceColorTheme,
  warnColorTheme,
  colorMix,
} from '@/style-system'

rules('.Text', {
  'visibility': token('inherit', {
    name: 'text-visibility',
    state: [
      [
        stateCondition('body:has(.StructureViewOverlay:popover-open) &'),
        'hidden',
      ],
    ],
  }),
  'color': token('inherit', {
    name: 'text-color',
    state: [
      [
        stateCondition('&[data-tone="muted"]'),
        colorMix([contentColorTheme, 0.7], [surfaceColorTheme, 0.3]),
      ],
      [stateCondition('&[data-tone="warning"]'), warnColorTheme],
      [stateCondition('&[data-tone="result"]'), contentColorTheme],
    ],
  }),
  'white-space': 'normal',
  'overflow-wrap': 'anywhere',
})
