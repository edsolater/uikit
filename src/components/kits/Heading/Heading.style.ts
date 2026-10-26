/** 定位框开启时只隐藏标题文字，保留原生排版与来源更新。 */
import { key, rules } from '@/style-system'

rules(
  ['body:has(.StructureViewOverlay:popover-open) .Heading'],
  [[key('visibility'), 'hidden']],
)
