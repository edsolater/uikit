/** 示例主页的条目、类别和响应式布局。 */
import {
  rules,
  token,
  stateCondition,
  baseSpace,
  baseRadius,
  baseBorderWidth,
  contentColorTheme,
  surfaceColorTheme,
  boundaryColorTheme,
  accentColorTheme,
  textSize,
  fontWeight,
  multiply,
  boundary,
} from '@/style-system'
import { valueSequence } from '@/style-system/pieces/token-factory/list'

const narrow = stateCondition('@media (max-width: 640px)')
const medium = stateCondition('@media (max-width: 1100px)')
const columns = token('repeat(6, minmax(0, 1fr))', {
  name: 'example-list-columns',
  state: [
    [medium, 'repeat(4, minmax(0, 1fr))'],
    [narrow, 'repeat(2, minmax(0, 1fr))'],
  ],
})
const listGap = token(multiply(baseSpace, 3), {
  name: 'example-list-gap',
  state: [[narrow, baseSpace]],
})
const ratio = token('16 / 10', {
  name: 'example-link-ratio',
  state: [[narrow, 1.25]],
})
const ribbonTop = token(0, {
  name: 'example-ribbon-top',
  state: [[narrow, multiply(baseSpace, 0.5)]],
})
const ribbonPadding = token('5px 12px', {
  name: 'example-ribbon-padding',
  state: [[narrow, '5px 10px']],
})
const ribbonSize = token('11px', {
  name: 'example-ribbon-size',
  state: [[narrow, '10px']],
})
const copyPadding = token(
  valueSequence('48px', multiply(baseSpace, 1.5), multiply(baseSpace, 1.5)),
  {
    name: 'example-copy-padding',
    state: [[narrow, valueSequence('40px', baseSpace, baseSpace)]],
  },
)

rules('.example-home', {
  'inline-size': 'min(100%, 1600px)',
  'margin-inline': 'auto',
  'display': 'grid',
  'gap': multiply(baseSpace, 6),
})
rules('.example-home-head', { display: 'grid', gap: multiply(baseSpace, 0.5) })
rules('.example-home-kicker', {
  'color': accentColorTheme,
  'font-size': multiply(textSize, 0.75),
  'font-weight': multiply(fontWeight, 1.25),
  'letter-spacing': '0.12em',
  'text-transform': 'uppercase',
})
rules('.example-home-head h1', {
  'margin': 0,
  'font-size': '40px',
  'line-height': 1,
})
rules('.example-list', {
  'display': 'grid',
  'grid-template-columns': columns,
  'gap': listGap,
})
rules('.example-link', [
  {
    'position': 'relative',
    'min-inline-size': 0,
    'aspect-ratio': ratio,
    'overflow': 'hidden',
    'display': 'grid',
    'align-content': 'end',
    'background': surfaceColorTheme,
    'color': contentColorTheme,
    'text-decoration': 'none',
  },
  boundary({
    border: [baseBorderWidth, 'solid', boundaryColorTheme],
    radius: multiply(baseRadius, 3),
    outline: {
      width: token(0, {
        name: 'example-link-outline-width',
        state: [[stateCondition('&:focus-visible'), '2px']],
      }),
      style: 'solid',
      color: accentColorTheme,
      offset: '3px',
    },
  }),
])
rules('.example-link-thumbnail', {
  'position': 'absolute',
  'inset': 0,
  'inline-size': '100%',
  'block-size': '100%',
  'object-fit': 'cover',
  'opacity': 0.5,
  'mask-image': 'linear-gradient(to bottom, black 0 42%, transparent 80% 100%)',
})
rules('.example-link-ribbon', {
  'position': 'absolute',
  'z-index': 2,
  'border-top-right-radius': baseRadius,
  'border-bottom-right-radius': baseRadius,
  'inset-block-start': ribbonTop,
  'inset-inline-start': 0,
  'padding': ribbonPadding,
  'background': 'var(--example-category-color)',
  'color': 'white',
  'font-size': ribbonSize,
  'font-weight': multiply(fontWeight, 1.25),
  'letter-spacing': '0.08em',
  'text-transform': 'uppercase',
})
rules('.example-link-copy', {
  'position': 'relative',
  'z-index': 1,
  'display': 'grid',
  'gap': multiply(baseSpace, 0.25),
  'padding': copyPadding,
  'text-align': 'end',
})
rules('.example-link :is(h2, p)', { margin: 0, color: 'inherit' })
rules('.example-link h2', {
  'overflow-wrap': 'anywhere',
  'font-size': '17px',
  'line-height': 1.15,
  'margin-block-end': '4px',
})
rules('.example-link p', {
  'font-size': '11px',
  'line-height': 1.35,
  'opacity': 0.72,
})
