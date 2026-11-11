/**
 * 辅助提示正文的紧凑暗色材料。
 *
 * 背景与文字直接绘制在同一个正文节点，定位由 Popover 能力负责。
 *
 * 提示拥有自己的外观，不改写其他浮层的材料。
 */
import {
  baseRadius,
  createNewTokenGenerator,
  multiply,
  rules,
} from '@/style-system'

const tooltipToken = createNewTokenGenerator({
  prefixName: 'tooltip',
  address: '.Tooltip',
})

export const tooltipBackground = tooltipToken('#1e293b')
export const tooltipContentColor = tooltipToken('#f8fafc')
export const tooltipBorder = tooltipToken('1px solid #334155')
export const tooltipRadius = tooltipToken(multiply(baseRadius, 2))
export const tooltipPadding = tooltipToken('10px 12px')
export const tooltipMaxWidth = tooltipToken('min(320px, calc(100vw - 24px))')
export const tooltipShadow = tooltipToken('0 6px 20px #0f172a26')
export const tooltipFont = tooltipToken('13px/1.6 system-ui')

rules('.Tooltip', {
  'background': tooltipBackground,
  'color': tooltipContentColor,
  'border': tooltipBorder,
  'border-radius': tooltipRadius,
  'padding': tooltipPadding,
  'width': 'max-content',
  'max-width': tooltipMaxWidth,
  'box-shadow': tooltipShadow,
  'font': tooltipFont,
  'white-space': 'normal',
})
