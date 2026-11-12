/** 示例浏览与详情页面的布局和内容样式。 */
import {
  rules,
  token,
  createJSSContent,
  stateCondition,
  baseSpace,
  baseRadius,
  baseBorderWidth,
  textSize,
  fontWeight,
  contentColorTheme,
  surfaceColorTheme,
  boundaryColorTheme,
  accentColorTheme,
  brandColorTheme,
  canvasColorTheme,
  badColorTheme,
  multiply,
  colorMix,
  boundary,
} from '@/style-system'
import { valueSequence } from '@/style-system/pieces/token-factory/list'

const narrow = stateCondition('@media (max-width: 640px)')
const muted = colorMix([contentColorTheme, 0.7], [surfaceColorTheme, 0.3])
const smallText = multiply(textSize, 0.75)
const semibold = multiply(fontWeight, 1.25)
const shellPadding = token(
  valueSequence('24px', 'clamp(16px, 5vw, 80px)', '96px'),
  {
    name: 'example-shell-padding',
    state: [
      [
        narrow,
        valueSequence(
          multiply(baseSpace, 3),
          multiply(baseSpace, 1.5),
          multiply(baseSpace, 4),
        ),
      ],
    ],
  },
)
const rowDirection = token('row', {
  name: 'example-setting-direction',
  state: [[narrow, 'column']],
})
const rowAlignment = token('center', {
  name: 'example-setting-alignment',
  state: [[narrow, 'flex-start']],
})
const rowGap = token(multiply(baseSpace, 2), {
  name: 'example-setting-gap',
  state: [[narrow, baseSpace]],
})
const buttonGap = token(() => baseSpace, {
  name: 'example-button-gap',
  state: [[narrow, multiply(baseSpace, 0.5)]],
})
const rowBorder = token(
  valueSequence(
    baseBorderWidth,
    'solid',
    colorMix([boundaryColorTheme, 0.2], 'transparent'),
  ),
  {
    name: 'example-setting-border',
    state: [[stateCondition('&:first-child'), 0]],
  },
)
const shellAccent = colorMix([accentColorTheme, 0.2], 'transparent')
const shellBrand = colorMix([brandColorTheme, 0.14], 'transparent')
const shellCanvas = colorMix([canvasColorTheme, 0.9], [accentColorTheme, 0.1])
const shellBackground = createJSSContent(
  (resolve) =>
    `radial-gradient(circle at 14% -6%, ${resolve(shellAccent)}, transparent 38%), radial-gradient(circle at 88% 8%, ${resolve(shellBrand)}, transparent 34%), linear-gradient(180deg, ${resolve(shellCanvas)}, ${resolve(canvasColorTheme)})`,
  [shellAccent, shellBrand, shellCanvas, canvasColorTheme],
)

rules('.example-shell', {
  'min-block-size': '100svb',
  'margin': 0,
  'display': 'grid',
  'align-content': 'start',
  'gap': multiply(baseSpace, 4),
  'padding': shellPadding,
  'background': shellBackground,
  'background-attachment': 'fixed',
})
rules('.example-card-head', { display: 'grid', gap: multiply(baseSpace, 0.25) })
rules('.example-card-head > span', {
  'font-size': smallText,
  'font-weight': semibold,
  'letter-spacing': '0.12em',
  'text-transform': 'uppercase',
  'color': accentColorTheme,
})
rules('.example-card-head :is(h1, h2)', {
  'margin': 0,
  'font-size': '28px',
  'font-weight': semibold,
  'letter-spacing': 0,
})
rules('.example-card > p', {
  'max-inline-size': '68ch',
  'color': muted,
  'font-size': '15px',
  'line-height': 1.6,
})
rules('.button-row', {
  'display': 'flex',
  'flex-wrap': 'wrap',
  'align-items': 'center',
  'gap': buttonGap,
})
rules('.button-example-grid', {
  'display': 'grid',
  'grid-template-columns': 'max-content repeat(4, minmax(0, 1fr))',
  'gap': valueSequence(baseSpace, multiply(baseSpace, 1.5)),
  'align-items': 'center',
})
rules('.button-example-grid > div', { 'min-inline-size': 0 })
rules('.button-example-head, .button-example-label', {
  'color': muted,
  'font-size': smallText,
  'font-weight': semibold,
})
rules('.button-size-stack, .input-row', { display: 'grid', gap: baseSpace })
rules('.setting-list', { display: 'grid' })
rules('.setting-row', {
  'min-block-size': '64px',
  'display': 'flex',
  'align-items': rowAlignment,
  'flex-direction': rowDirection,
  'justify-content': 'space-between',
  'gap': rowGap,
  'padding': valueSequence(multiply(baseSpace, 1.5), 0),
  'border-block-start': rowBorder,
})
rules('.setting-copy, .field-copy', {
  'min-inline-size': 0,
  'display': 'grid',
  'gap': multiply(baseSpace, 0.25),
})
rules('.setting-copy strong, .field-copy label', {
  'color': contentColorTheme,
  'font-weight': semibold,
})
rules('.setting-copy span, .field-copy span', {
  'color': muted,
  'font-size': smallText,
})
rules('.field-row', {
  'display': 'grid',
  'align-items': 'stretch',
  'grid-template-columns': '1fr',
})
rules('.field-error', { 'color': badColorTheme, 'font-size': smallText })
rules('.example-stack', { display: 'grid', gap: multiply(baseSpace, 1.5) })
rules('.example-detail, .example-missing', {
  'inline-size': 'min(100%, 1120px)',
  'margin-inline': 'auto',
  'display': 'grid',
})
rules('.example-detail', { gap: multiply(baseSpace, 2) })
rules('.example-back', {
  'inline-size': 'fit-content',
  'color': accentColorTheme,
})
rules('.popover-row', {
  'display': 'flex',
  'flex-wrap': 'wrap',
  'gap': baseSpace,
  'align-items': 'center',
})
rules('.title-card', {
  'display': 'flex',
  'justify-content': 'space-between',
  'align-items': 'center',
  'gap': multiply(baseSpace, 1.5),
  'padding': valueSequence(multiply(baseSpace, 2), multiply(baseSpace, 3)),
  'border-radius': multiply(baseRadius, 3),
  'background': surfaceColorTheme,
})
rules('.title-card strong', {
  'font-size': textSize,
  'color': contentColorTheme,
})
rules('.structure-case', {
  'position': 'relative',
  'padding': valueSequence(multiply(baseSpace, 1.5), multiply(baseSpace, 2)),
  'border': '1px solid #d0d7de',
  'border-radius': multiply(baseRadius, 2),
  'background': '#ffffff',
})
rules('.structure-tag', {
  'width': 'fit-content',
  'padding': valueSequence(multiply(baseSpace, 0.25), baseSpace),
  'border-radius': baseRadius,
  'background': 'red',
  'color': 'white',
  'font-size': smallText,
  'font-weight': semibold,
})
rules('.structure-button', {
  'position': 'relative',
  'width': 'fit-content',
  'min-height': '36px',
  'padding': valueSequence(0, multiply(baseSpace, 2)),
  'border': '1px solid #d0d7de',
  'border-radius': multiply(baseRadius, 2),
  'background': '#ffffff',
  'color': '#111111',
  'font': 'inherit',
})
rules('.structure-red-dot', {
  'position': 'absolute',
  'top': '6px',
  'right': '6px',
  'width': '8px',
  'height': '8px',
  'border-radius': '50%',
  'background': 'red',
})
rules('.structure-manager', {
  'display': 'grid',
  'gap': baseSpace,
  'padding': baseSpace,
  'border': '2px solid red',
  'border-radius': multiply(baseRadius, 3),
  'background': '#fff5f5',
})
rules(['.structure-manager', '&::before'], {
  'content': '"wrapper from plugin"',
  'color': 'red',
  'font-size': smallText,
  'font-weight': semibold,
})
rules('.structure-editor', {
  'display': 'grid',
  'gap': multiply(baseSpace, 0.5),
  'padding': multiply(baseSpace, 1.5),
  'border': '1px solid #d0d7de',
  'border-radius': multiply(baseRadius, 2),
  'background': '#ffffff',
})
rules('.structure-editor-title', {
  'font-weight': semibold,
  'color': '#111111',
})
rules('.structure-editor-body', { color: '#555555' })
rules('.structure-note', { 'color': '#555555', 'font-size': smallText })
