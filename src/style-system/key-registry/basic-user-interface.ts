/**
 * CSS basic-user-interface 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- accent-color 属性族 ---

export const $accentColor = key('accent-color')

// --- appearance 属性族 ---

export const $appearance = key('appearance')

// --- caret 属性族 ---

export const $caret = key('caret')

export const $caretAnimation = key('caret-animation')

export const $caretColor = key('caret-color')

export const $caretShape = key('caret-shape')

// --- cursor 属性族 ---

/** cursor Key，描述鼠标经过元素时的指针形态。 */
export const $cursor = key('cursor')

// --- field-sizing 属性族 ---

export const $fieldSizing = key('field-sizing')

// --- interactivity 属性族 ---

export const $interactivity = key('interactivity')

// --- interest 属性族 ---

export const $interestDelay = key('interest-delay')

export const $interestDelayEnd = key('interest-delay-end')

export const $interestDelayStart = key('interest-delay-start')

// --- outline 属性族 ---

export const $outline = key('outline')

/** outline-color Key，设置轮廓颜色。 */
export const $outlineColor = key('outline-color')

/** outline-offset Key；设置轮廓与元素边缘的间隔，负值向内收。 */
export const $outlineOffset = key('outline-offset')

/** outline-style Key，设置轮廓线型。 */
export const $outlineStyle = key('outline-style')

/** outline-width Key，设置轮廓线厚度。 */
export const $outlineWidth = key('outline-width')

// --- pointer-events 属性族 ---

export const $pointerEvents = key('pointer-events')

// --- resize 属性族 ---

export const $resize = key('resize')

// --- user-select 属性族 ---

/** user-select Key，描述元素文本能否被用户选中。 */
export const $userSelect = key('user-select')

/** basic-user-interface 模块的 CSS 原名与具名 Key 对应表。 */
export const basicUserInterfaceKeys = {
  'accent-color': $accentColor,
  'appearance': $appearance,
  'caret': $caret,
  'caret-animation': $caretAnimation,
  'caret-color': $caretColor,
  'caret-shape': $caretShape,
  'cursor': $cursor,
  'field-sizing': $fieldSizing,
  'interactivity': $interactivity,
  'interest-delay': $interestDelay,
  'interest-delay-end': $interestDelayEnd,
  'interest-delay-start': $interestDelayStart,
  'outline': $outline,
  'outline-color': $outlineColor,
  'outline-offset': $outlineOffset,
  'outline-style': $outlineStyle,
  'outline-width': $outlineWidth,
  'pointer-events': $pointerEvents,
  'resize': $resize,
  'user-select': $userSelect,
}
