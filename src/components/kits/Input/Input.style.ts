/** 单行输入的材料、焦点与有效性反馈。 */
import {
  rules, createNewTokenGenerator, stateCondition, colorMix, multiply,
  surfaceColorTheme, contentColorTheme, brandColorTheme, badColorTheme, baseSpace, baseRadius,
  baseBorderWidth, controlSize, motionDuration, motionEasing, boundary,
} from '@/style-system'
import { valueSequence } from '@/style-system/pieces/token-factory/list'
import { transitionValue } from '@/style-system/pieces/token-factory/transition'

const input = ['@layer uikit', '.Input']
const inputToken = createNewTokenGenerator({ prefixName: 'input', address: input })
const hoverEnabled = stateCondition('&:hover:not(:disabled)')
const hoverValid = stateCondition('&:hover:not(:disabled, [data-status~="invalid"])')
const invalid = stateCondition('&[data-status~="invalid"]')
const invalidFocus = stateCondition('&[data-status~="invalid"]:focus-visible')

export const inputMinHeight = inputToken(multiply(controlSize, 5 / 6))
export const inputPaddingInline = inputToken(() => baseSpace)
export const inputRadius = inputToken(multiply(baseRadius, 2))
export const inputBorderWidth = inputToken(baseBorderWidth)
export const inputBackgroundColor = inputToken(colorMix([contentColorTheme, 0.03], surfaceColorTheme), {
  state: [[hoverEnabled, surfaceColorTheme], ['focus', surfaceColorTheme], ['disabled', colorMix([contentColorTheme, 0.05], 'transparent')]],
})
export const inputContentColor = inputToken(() => contentColorTheme, {
  state: { disabled: colorMix([contentColorTheme, 0.45], 'transparent') },
})
export const inputPlaceholderColor = inputToken(colorMix([contentColorTheme, 0.55], 'transparent'), {
  state: { disabled: colorMix([contentColorTheme, 0.45], 'transparent') },
})
export const inputBorderColor = inputToken(colorMix([contentColorTheme, 0.18], 'transparent'), {
  state: [[hoverValid, colorMix([contentColorTheme, 0.35], 'transparent')], ['focus', brandColorTheme], ['disabled', colorMix([contentColorTheme, 0.12], 'transparent')], [invalid, badColorTheme]],
})
export const inputFocusShadow = inputToken('none', {
  state: [
    ['focus', valueSequence(0, 0, 0, '0.2em', colorMix([brandColorTheme, 0.25], 'transparent'))],
    [invalidFocus, valueSequence(0, 0, 0, '0.2em', colorMix([badColorTheme, 0.25], 'transparent'))],
  ],
})
export const inputCursor = inputToken('inherit', { state: { disabled: 'not-allowed' } })

rules(input, [
  {
    width: '100%',
    'min-height': inputMinHeight,
    'padding-inline': inputPaddingInline,
    color: inputContentColor,
    'background-color': inputBackgroundColor,
    'box-shadow': inputFocusShadow,
    outline: 'none',
    cursor: inputCursor,
    transition: transitionValue(
      ['border-color', multiply(motionDuration, 2 / 3), motionEasing],
      ['box-shadow', multiply(motionDuration, 2 / 3), motionEasing],
      ['background-color', multiply(motionDuration, 2 / 3), motionEasing],
      ['color', multiply(motionDuration, 2 / 3), motionEasing],
    ),
  },
  boundary({ border: [inputBorderWidth, 'solid', inputBorderColor], radius: inputRadius }),
])
rules(['@layer uikit', '.Input::placeholder'], { color: inputPlaceholderColor })
