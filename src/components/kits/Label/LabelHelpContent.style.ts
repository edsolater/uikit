/** 帮助说明自身拥有浮层定位与阅读外观。 */
import { rules } from '@/style-system'
rules('.LabelHelpContent', {
  position: 'fixed',
  inset: 'auto',
  'position-area': 'top',
  'position-try-fallbacks': 'flip-block, flip-inline',
  margin: '0 0 8px',
  width: 'max-content',
  'max-width': 'min(320px, calc(100vw - 24px))',
  padding: '10px 12px',
  border: '1px solid #334155',
  'border-radius': '8px',
  background: '#1e293b',
  color: '#f8fafc',
  font: '13px/1.6 system-ui',
  'white-space': 'normal',
  'box-shadow': '0 6px 20px #0f172a26',
  'position-anchor': 'attr(data-anchor type(<custom-ident>))',
})
