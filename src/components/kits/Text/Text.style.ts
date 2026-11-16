/**
 * Text 的文字语气、尺寸与结构查看样式。
 *
 * 按文字输入选择语气和相对字号，结构查看只隐藏文字像素。
 *
 * 使文字继续参与真实排版和内容更新，阅读状态与定位模式共用同一节点。
 */
import { componentName } from './Text.prop'
import {
  rules,
  token,
  stateCondition,
  contentColorTheme,
  surfaceColorTheme,
  warnColorTheme,
  colorMix,
} from '@/style-system'

rules(`.${componentName}`, {
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
  'font-size': token('inherit', {
    name: 'text-font-size',
    state: [[stateCondition('&[data-small="true"]'), '0.8em']],
  }),
  'white-space': 'normal',
  'overflow-wrap': 'anywhere',
})
