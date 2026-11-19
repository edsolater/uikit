/** 外层承担保留高度，内层始终按内容排版，独立测量换行与子块外边距。 */
import { rules } from '@/style-system'
import { componentName } from './Stat.prop'

rules(`.${componentName}:not([data-fit-content])`, {
  'min-height': 'max(1lh, var(--stat-content-height))',
})
rules('.StatContent', { 'display': 'flow-root', 'align-self': 'start' })
