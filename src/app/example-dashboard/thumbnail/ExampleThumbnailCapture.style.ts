/** 示例缩略图的固定画布与内容裁切。 */
import {
  rules,
  baseSpace,
  baseRadius,
  surfaceColorTheme,
  multiply,
} from '@/style-system'

rules('.example-thumbnail-capture-stage', {
  'inline-size': '800px',
  'block-size': '450px',
  'overflow': 'hidden',
  'padding': '32px',
  'background':
    'radial-gradient(circle at 12% 0%, oklch(74% 0.16 255 / 22%), transparent 46%), radial-gradient(circle at 92% 12%, oklch(78% 0.12 315 / 16%), transparent 42%), oklch(95.5% 0.018 262)',
})
rules('.example-thumbnail-capture-stage > .example-card', {
  'min-block-size': '100%',
  'align-content': 'start',
})
rules('.example-thumbnail-capture-stage > section', {
  'min-block-size': '100%',
  'align-content': 'start',
  'padding': '28px',
  'display': 'grid',
  'gap': multiply(baseSpace, 1.5),
  'overflow': 'hidden',
  'border-radius': multiply(baseRadius, 3),
  'background': surfaceColorTheme,
})
rules(
  '.example-thumbnail-capture-stage > .example-card > :is(.example-card-head, p), .example-thumbnail-capture-stage > section > h2',
  { display: 'none' },
)
