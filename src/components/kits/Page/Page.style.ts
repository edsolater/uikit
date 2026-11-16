/**
 * Page 的页面主体宽度与留白样式。
 *
 * 约束主体最大宽度并居中，按视口调整边缘留白和区域间隔。
 *
 * 让页面组合直接获得共同的阅读幅面，业务内容只需声明区域结构。
 */
import { componentName } from './Page.prop'
import { rules } from '@/style-system'
rules(`.${componentName}`, {
  'width': '100%',
  'box-sizing': 'border-box',
  'max-width': '80rem',
  'margin-inline': 'auto',
  'padding': 'clamp(1rem, 3vw, 2.5rem)',
  'display': 'grid',
  'gap': '1.5rem',
  'min-width': '0',
})
