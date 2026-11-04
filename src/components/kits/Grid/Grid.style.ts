/**
 * 列结构及窄屏退列的网格样式。
 *
 * 消费每个实例自己的列模板，保持固定间距与可选伸展。
 *
 * 模板独立绑定，嵌套网格不继承上层列数。
 */
import { rules, token, stateCondition } from '@/style-system'
const columns = token(
  'var(--grid-columns)',
  { name: 'grid-template-columns', state: [
    [stateCondition('@media (width < 48rem)'), 'minmax(0, 1fr)'],
    [stateCondition('&[data-responsive="false"]'), 'var(--grid-columns)'],
  ] },
)
const flex = token('initial', { name: 'grid-flex', state: [[stateCondition('&[data-grow="true"]'), '1']] })
rules('.Grid', {
  display: 'grid',
  'grid-template-columns': columns,
  gap: '1rem',
  'align-items': 'start',
  'min-width': '0',
  flex,
})
