/** 为可交互主体提供可复用的点击与焦点反馈。 */
import type { Declarations } from '../core/css-rule'
import { value, type ValueInput } from '../core/css-value'
import { $cursor, $userSelect } from '../properties/interaction'
import { $opacity } from '../properties/opacity'
import { $transform } from '../properties/transform'
import { $transition } from '../properties/transition'
import { $backgroundColor, $color } from '../properties/color'
import { $borderColor } from '../properties/border'
import { $boxShadow } from '../properties/box-shadow'
import { translateY } from '../values/functions/transform'
import { whenActive, whenDisabled } from '../selectors/msic'
import { disabledFade } from '../values/materials/opacity'
import { fast, standard } from '../values/materials/motion'
import { focusStroke, focusGap } from '../values/materials/space'
import { boundary } from './structure'

/** 赋予当前主体可点击效果，统一管理指针、按压、禁用和过渡反馈。 */
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

/** 使用指定提示色为当前主体提供可见的键盘焦点轮廓。 */
export const focusRing = (ringColor: ValueInput): Declarations => [boundary({
  outline: {
    width: focusStroke,
    style: 'solid',
    color: ringColor,
    offset: focusGap,
  },
})]
