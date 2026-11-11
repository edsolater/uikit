import { rules } from '@/style-system'
rules('.Page', {
  'width': '100%',
  'box-sizing': 'border-box',
  'max-width': '80rem',
  'margin-inline': 'auto',
  'padding': 'clamp(1rem, 3vw, 2.5rem)',
  'display': 'grid',
  'gap': '1.5rem',
  'min-width': '0',
})
