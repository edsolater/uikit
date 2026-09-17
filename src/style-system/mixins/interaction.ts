/** 点击交互 Mixin。 */
import type { Declarations } from '../core/css-rule'
import { value } from '../core/css-value'
import { $cursor, $userSelect } from '../properties/interaction'
import { $opacity } from '../properties/opacity'
import { $transform } from '../properties/transform'
import { $transition } from '../properties/transition'
import { $backgroundColor, $color } from '../properties/color'
import { $borderColor } from '../properties/border'
import { $boxShadow } from '../properties/box-shadow'
import { translateY } from '../values/functions/transform'
import { whenActive, whenDisabled } from '../selectors/interaction'
import { disabledFade } from '../values/materials/opacity'
import { fast, standard } from '../values/materials/motion'

/** Mixin：可点击效果。 */
export const clickable = (): Declarations => [
  [$cursor, value('pointer', [[whenDisabled, 'not-allowed']])],
  [$opacity, value(1, [[whenDisabled, disabledFade]])],
  [$transform, value('none', [
    [whenActive, translateY('1px')],
    [whenDisabled, 'none'],
  ])],
  [$userSelect, 'none'],
  [
    $transition,
    [
      [$backgroundColor, fast, standard],
      [$borderColor, fast, standard],
      [$boxShadow, fast, standard],
      [$color, fast, standard],
      [$opacity, fast, standard],
      [$transform, fast, standard],
    ],
  ],
]
