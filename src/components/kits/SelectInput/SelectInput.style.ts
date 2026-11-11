/** 搜索输入、轻量标签和候选列表各自的显示。 */
import {
  rules,
  surfaceColorTheme,
  contentColorTheme,
  brandColorTheme,
  baseSpace,
  baseRadius,
  controlSize,
  multiply,
  colorMix,
  oklch,
  createNewTokenGenerator,
  stateCondition,
} from '@/style-system'
import { valueSequence } from '@/style-system/pieces/token-factory/list'

const frame = ['@layer uikit', '.SelectInput']
const frameToken = createNewTokenGenerator({
  prefixName: 'select-input',
  address: frame,
})
const focus = stateCondition('&:focus-within')
const frameBorder = frameToken(
  colorMix([contentColorTheme, 0.18], 'transparent'),
  { state: [[focus, brandColorTheme]] },
)
const frameShadow = frameToken('none', {
  state: [
    [
      focus,
      valueSequence(
        0,
        0,
        0,
        '0.2em',
        colorMix([brandColorTheme, 0.25], 'transparent'),
      ),
    ],
  ],
})
const option = ['@layer uikit', '.SelectInput-option']
const optionToken = createNewTokenGenerator({
  prefixName: 'select-input-option',
  address: option,
})
const optionBackground = optionToken('transparent', {
  state: [
    [
      stateCondition('&[aria-selected="true"]'),
      colorMix([brandColorTheme, 0.12], surfaceColorTheme),
    ],
  ],
})

rules(frame, {
  'display': 'flex',
  'align-items': 'center',
  'gap': multiply(baseSpace, 0.35),
  'width': '100%',
  'min-width': 0,
  'min-height': multiply(controlSize, 5 / 6),
  'padding-inline': baseSpace,
  'border-radius': multiply(baseRadius, 2),
  'border': '1px solid',
  'border-color': frameBorder,
  'box-shadow': frameShadow,
  'background-color': colorMix([contentColorTheme, 0.03], surfaceColorTheme),
})
rules(['@layer uikit', '.SelectInput-input'], {
  'field-sizing': 'content',
  'min-width': '5ch',
  'max-width': '100%',
  'border': 'none',
  'outline': 'none',
  'background': 'transparent',
  'color': contentColorTheme,
  'font': 'inherit',
})
rules(['@layer uikit', '.SelectInput-tag'], {
  'font-size': '0.75em',
  'font-weight': 'normal',
  'color': colorMix([contentColorTheme, 0.65], 'transparent'),
  'white-space': 'nowrap',
})
rules(['@layer uikit', '.SelectInput-options'], {
  'max-height': '50vh',
  'max-width': 'min(48rem, 90vw)',
  'overflow': 'auto',
  'border-radius': baseRadius,
  'background-color': oklch({ base: surfaceColorTheme, alpha: 1 }),
  'color': contentColorTheme,
})
rules(option, {
  'display': 'block',
  'width': '100%',
  'padding': '0.4em 0.75em',
  'border': 'none',
  'background': optionBackground,
  'color': contentColorTheme,
  'text-align': 'left',
  'font': 'inherit',
  'line-height': 1.4,
  'cursor': 'pointer',
})
rules(['@layer uikit', '.SelectInput-message'], { padding: '0.4em 0.75em' })
