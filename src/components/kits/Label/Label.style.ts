/**
 * Label 的字段标题与帮助入口样式。
 *
 * 维持标题和问号的行内对齐、间隔及文字层次，并响应结构查看。
 *
 * 让可见标题在字段组合中紧凑呈现，提示浮层独立定位。
 */
import { componentName } from './Label.prop'
import { rules } from '@/style-system'

rules(`.${componentName}`, {
  'display': 'inline-flex',
  'align-items': 'center',
  'gap': '4px',
  'font-size': '13px',
  'line-height': 1.2,
  'min-block-size': '1lh',
  'color': '#64748b',
  'min-width': 0,
})
rules([`.${componentName}`, '> label'], { cursor: 'pointer' })
rules(
  `body:has(.StructureViewOverlay:popover-open) .${componentName} > label`,
  {
    visibility: 'hidden',
  },
)
