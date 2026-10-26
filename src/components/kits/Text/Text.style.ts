/** 定位框开启时只隐藏文字像素，文字继续排版与更新。 */
import { key, rules } from '@/style-system'

rules(
  ['body:has(.StructureViewOverlay:popover-open) .Text'],
  [[key('visibility'), 'hidden']],
)
