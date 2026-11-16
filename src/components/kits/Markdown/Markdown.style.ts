/**
 * Markdown 自有阅读节点的排版。
 *
 * 恢复段落、列表与表格在 reset 后所需的间距和辨识边界。
 *
 * 样式仅作用于默认生成的部分，不接管 Heading、Link 或自定义组件。
 */
import { rules, token, stateCondition } from '@/style-system'
import { baseSpace } from '@/style-system/pieces/tokens/space'

/** Markdown 块内容之间的阅读间隔。 */
export const markdownBlockSpace = token('1em', { name: 'markdown-block-space' })
rules('.Markdown', { 'min-inline-size': 0, 'margin-trim': 'block' })
rules('.Markdown-paragraph', { 'margin-block': markdownBlockSpace })
rules('.Markdown-heading', { 'margin-block': markdownBlockSpace })
rules('.Markdown-list', {
  'margin-block': markdownBlockSpace,
  'padding-inline-start': '1.75em',
})
rules('.Markdown-list-item', { 'margin-block': '.25em' })
rules('.Markdown-quote', {
  'margin-block': markdownBlockSpace,
  'padding-inline-start': '1em',
  'border-inline-start': '3px solid currentColor',
})
rules('.Markdown-table', { 'margin-block': markdownBlockSpace })
rules('.Markdown-cell', {
  'padding': baseSpace,
  'border': '1px solid currentColor',
  'text-align': token('start', {
    name: 'markdown-cell-align',
    state: [
      [stateCondition('&[data-align="left"]'), 'left'],
      [stateCondition('&[data-align="center"]'), 'center'],
      [stateCondition('&[data-align="right"]'), 'right'],
    ],
  }),
})
rules('.Markdown-inline-code', {
  'font-family': 'monospace',
  'white-space': 'break-spaces',
})
rules('.Markdown-code-block', {
  'margin-block': markdownBlockSpace,
  'padding': baseSpace,
  'overflow-x': 'auto',
  'border': '1px solid currentColor',
})
rules('.Markdown-separator', { 'margin-block': markdownBlockSpace })
