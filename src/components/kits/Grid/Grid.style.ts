import { rules, token, stateCondition } from '@/style-system'
const columns = token(
  'repeat(attr(data-columns type(<integer>)), minmax(0, 1fr))',
  { state: [[stateCondition('@media (width < 48rem)'), 'minmax(0, 1fr)']] },
)
/** 小屏统一单列，避免内容被分栏挤压。 */
rules('.Grid', {
  display: 'grid',
  'grid-template-columns': columns,
  gap: '1rem',
  'align-items': 'start',
  'min-width': '0',
})
