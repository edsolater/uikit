/**
 * 辅助提示的紧凑暗色材料。
 *
 * 仅在当前浮层选择Popover公开Token，不重复定位和箭头。
 *
 * 保留提示外观，并使其他Popover继续使用自身材料。
 */
import { rules, modify, type Token } from '@/style-system'
import {
  popoverBackground,
  popoverContentColor,
  popoverBorder,
  popoverRadius,
  popoverPadding,
  popoverMinWidth,
  popoverMaxWidth,
  popoverGap,
  popoverArrowSize,
  popoverShadow,
  popoverFont,
} from '@/components/kits/Popover/PopoverSurface.style'

const materials: [Token, string][] = [
  [popoverBackground, '#1e293b'],
  [popoverContentColor, '#f8fafc'],
  [popoverBorder, '1px solid #334155'],
  [popoverRadius, '8px'],
  [popoverPadding, '10px 12px'],
  [popoverMinWidth, '0'],
  [popoverMaxWidth, 'min(320px, calc(100vw - 24px))'],
  [popoverGap, '8px'],
  [popoverArrowSize, '10px'],
  [popoverShadow, '0 6px 20px #0f172a26'],
  [popoverFont, '13px/1.6 system-ui'],
]

rules('.PopoverSurface.Tooltip', materials.map(([target, value]) =>
  modify(target, { type: 'expression', detail: () => value }),
))
