/** 拖拽示例共享的布局、拖动源与接收状态。 */
import {
  rules, token, createNewTokenGenerator, stateCondition, multiply, colorMix,
  baseSpace, baseRadius, baseBorderWidth, textSize, fontWeight,
  brandColorTheme, badColorTheme, goodColorTheme, surfaceColorTheme, contentColorTheme, boundaryColorTheme, motionDuration, motionEasing,
} from '@/style-system'

const card = '.drag-drop-example-card'
const target = '.drag-drop-example-target'
const targetToken = createNewTokenGenerator({ prefixName: 'drag-example-target', address: target })
const hovering = stateCondition('&[data-drop-hovering="true"]')
const acceptable = stateCondition('&[data-drop-acceptable="true"]')
const received = stateCondition('&[data-drop-received="true"]')
const targetBorderColor = targetToken(() => boundaryColorTheme, {
  state: [[hovering, badColorTheme], [acceptable, goodColorTheme], [received, goodColorTheme]],
})
const targetBackground = targetToken(colorMix([surfaceColorTheme, 0.8], 'transparent'), {
  state: [
    [hovering, colorMix([badColorTheme, 0.08], surfaceColorTheme)],
    [acceptable, colorMix([goodColorTheme, 0.1], surfaceColorTheme)],
    [received, colorMix([goodColorTheme, 0.12], surfaceColorTheme)],
  ],
})
const targetContentColor = targetToken(() => contentColorTheme)
const targetBorderStyle = targetToken('dashed', { state: [[received, 'solid']] })
const cardCursor = createNewTokenGenerator({ prefixName: 'drag-example-card' })('grab', {
  state: [[stateCondition('&:active'), 'grabbing']],
})
const cardOpacity = createNewTokenGenerator({ prefixName: 'drag-example-card-opacity' })(1, {
  state: [[stateCondition('&[data-interacting="true"]'), 1]],
})
const resultColor = createNewTokenGenerator({ prefixName: 'drag-example-result' })(contentColorTheme, {
  state: [[stateCondition('.drag-drop-example-target[data-drop-received="true"] &'), goodColorTheme]],
})
const resultWeight = createNewTokenGenerator({ prefixName: 'drag-example-result-weight' })(fontWeight, {
  state: [[stateCondition('.drag-drop-example-target[data-drop-received="true"] &'), multiply(fontWeight, 1.25)]],
})
const transition = token([multiply(motionDuration, 2 / 3), motionEasing], {
  name: 'drag-example-transition',
  toCSSString: ([duration, easing], resolve) =>
    ['border-color', 'background-color', 'opacity', 'transform']
      .map((property) => `${property} ${resolve(duration)} ${resolve(easing)}`).join(', '),
})

rules('.drag-drop-example-grid', { display: 'grid', 'grid-template-columns': 'repeat(auto-fit, minmax(220px, 1fr))', gap: multiply(baseSpace, 1.5) })
rules('.drag-drop-example-stack', { display: 'grid', gap: baseSpace })
const shared = {
  'min-block-size': '108px', display: 'grid', 'place-items': 'center',
  padding: multiply(baseSpace, 1.5), 'border-radius': multiply(baseRadius, 3),
  'text-align': 'center',
  transition,
} as const
rules(card, {
  ...shared, cursor: cardCursor, opacity: cardOpacity, 'border-width': baseBorderWidth, 'border-style': 'solid',
  'border-color': colorMix([brandColorTheme, 0.45], boundaryColorTheme),
  background: colorMix([brandColorTheme, 0.12], surfaceColorTheme), color: contentColorTheme,
  'font-weight': multiply(fontWeight, 1.25), 'user-select': 'none',
})
rules(target, {
  ...shared, 'align-content': 'center', gap: multiply(baseSpace, 0.5), 'border-width': '2px',
  'border-style': targetBorderStyle, 'border-color': targetBorderColor,
  background: targetBackground, color: targetContentColor,
})
rules('.drag-drop-example-target-label', { color: 'inherit' })
rules('.drag-drop-example-target-result', { 'max-inline-size': '100%', color: resultColor, 'font-size': multiply(textSize, 0.75), 'font-weight': resultWeight, 'overflow-wrap': 'anywhere' })
rules('.drag-drop-example-result', { 'min-block-size': '24px', margin: 0, color: contentColorTheme, 'font-size': multiply(textSize, 0.75) })
rules('.drag-drop-example-group', { display: 'grid', gap: baseSpace, padding: multiply(baseSpace, 1.5), 'border-width': baseBorderWidth, 'border-style': 'solid', 'border-color': boundaryColorTheme, 'border-radius': multiply(baseRadius, 3), background: colorMix([surfaceColorTheme, 0.72], 'transparent') })
rules('.drag-drop-example-group > strong', { color: contentColorTheme })
