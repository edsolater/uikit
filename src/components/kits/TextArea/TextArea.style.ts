import { rules } from '@/style-system'
rules('.TextArea', {
  'box-sizing': 'border-box',
  width: '100%',
  'min-width': '0',
  font: 'inherit',
  padding: 'var(--space-3)',
  color: 'var(--color-fg-strong)',
  background: 'var(--color-surface-low)',
  border: '1px solid var(--color-line)',
  'border-radius': 'var(--radius-3)',
  'min-height': '5rem',
  resize: 'vertical',
})
