/**
 * NavigationRegion 的导航内容排列样式。
 *
 * 纵向组织区域内的导航内容，保留条目间隔与可收缩宽度。
 *
 * 让导航组织形成稳定的默认节奏，链接外观仍由具体链接拥有。
 */
import { componentName } from './NavigationRegion.prop'
import { rules } from '@/style-system'
rules(`.${componentName}`, {
  'display': 'flex',
  'flex-direction': 'column',
  'gap': '1rem',
  'min-width': '0',
})
