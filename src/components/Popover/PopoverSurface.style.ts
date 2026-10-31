/**
 * 通用浮层的显示材料与锚点定位。
 *
 * 公开Token控制外观，原生回退定位同步调整箭头。
 *
 * 所有浮层包装共用这一份定位与箭头规则。
 */
import {
  rules,
  token,
  createNewTokenGenerator,
  stateCondition,
  multiply,
  add,
} from '@/style-system'

const surface = '.PopoverSurface'
const surfaceToken = createNewTokenGenerator({
  prefixName: 'popover',
  address: surface,
})
const top = stateCondition('&[data-placement="top"]')
const right = stateCondition('&[data-placement="right"]')
const left = stateCondition('&[data-placement="left"]')
const anchored = stateCondition('&[data-anchor]')
const flipBlock = stateCondition('@container anchored(fallback: flip-block)')
const flipInline = stateCondition('@container anchored(fallback: flip-inline)')

export const popoverBackground = surfaceToken(
  'radial-gradient(circle at top left, rgba(255,174,125,.18), transparent 34%), linear-gradient(145deg, rgba(23,28,37,.98), rgba(16,20,29,.96))',
)
export const popoverContentColor = surfaceToken('#f8f4ee')
export const popoverBorder = surfaceToken('1px solid rgba(255,248,239,.14)')
export const popoverRadius = surfaceToken('22px')
export const popoverPadding = surfaceToken('16px 18px')
export const popoverMinWidth = surfaceToken('240px')
export const popoverMaxWidth = surfaceToken('min(340px, calc(100vw - 24px))')
export const popoverGap = surfaceToken('14px')
export const popoverArrowSize = surfaceToken('18px')
export const popoverShadow = surfaceToken('0 24px 54px rgba(16,20,29,.32)')
export const popoverFont = surfaceToken('inherit')

const arrowHalfSize = multiply(popoverArrowSize, 0.5)

/**
 * 生成完整圆角主体及指定边的箭头；尖端来自几何容器，基点避开圆角后可斜指目标。
 */
function createPopoverOutline(
  side: 'top' | 'right' | 'bottom' | 'left' | 'none',
) {
  return token('', {
    dependencies: [popoverRadius, arrowHalfSize],
    toCSSString: (_value, resolve) => {
      const radius = resolve(popoverRadius)
      const arrow = resolve(arrowHalfSize)
      const x0 = arrow
      const y0 = arrow
      const x1 = `calc(100% - ${arrow})`
      const y1 = `calc(100% - ${arrow})`
      const x = `clamp(calc(${arrow} * 2 + ${radius}), 100cqw, calc(100% - ${arrow} * 2 - ${radius}))`
      const y = `clamp(calc(${arrow} * 2 + ${radius}), 100cqh, calc(100% - ${arrow} * 2 - ${radius}))`
      return `shape(from calc(${x0} + ${radius}) ${y0},
        ${side === 'top' ? `hline to calc(${x} - ${arrow}), line to 100cqw 0, line to calc(${x} + ${arrow}) ${y0},` : ''}
        hline to calc(${x1} - ${radius}),
        curve to ${x1} calc(${y0} + ${radius}) with ${x1} ${y0},
        ${side === 'right' ? `vline to calc(${y} - ${arrow}), line to 100% 100cqh, line to ${x1} calc(${y} + ${arrow}),` : ''}
        vline to calc(${y1} - ${radius}),
        curve to calc(${x1} - ${radius}) ${y1} with ${x1} ${y1},
        ${side === 'bottom' ? `hline to calc(${x} + ${arrow}), line to 100cqw 100%, line to calc(${x} - ${arrow}) ${y1},` : ''}
        hline to calc(${x0} + ${radius}),
        curve to ${x0} calc(${y1} - ${radius}) with ${x0} ${y1},
        ${side === 'left' ? `vline to calc(${y} + ${arrow}), line to 0 100cqh, line to ${x0} calc(${y} - ${arrow}),` : ''}
        vline to calc(${y0} + ${radius}),
        curve to calc(${x0} + ${radius}) ${y0} with ${x0} ${y0}, close)`
    },
  })
}

const outlineTop = createPopoverOutline('top')
const outlineRight = createPopoverOutline('right')
const outlineBottom = createPopoverOutline('bottom')
const outlineLeft = createPopoverOutline('left')
const outline = surfaceToken(createPopoverOutline('none'), {
  state: [
    [anchored, outlineTop],
    [top, outlineBottom],
    [right, outlineLeft],
    [left, outlineRight],
  ],
})
const blockFallbackOutline = surfaceToken(outlineBottom, {
  state: [[top, outlineTop]],
})
const inlineFallbackOutline = surfaceToken(outlineRight, {
  state: [[left, outlineLeft]],
})

rules(surface, {
  'isolation': 'isolate',
  'overflow': 'visible',
  'background': 'transparent',
  'border': 0,
  'color': popoverContentColor,
  'padding': popoverPadding,
  'width': 'max-content',
  'min-width': popoverMinWidth,
  'max-width': popoverMaxWidth,
  'font': popoverFont,
  'white-space': 'normal',
  'position': 'fixed',
  'inset': token('0', {
    name: 'popover-inset',
    state: [[anchored, 'auto']],
  }),
  'margin': token('auto', {
    name: 'popover-margin',
    state: [[anchored, popoverGap]],
  }),
  'position-anchor': 'attr(data-anchor type(<custom-ident>))',
  'position-area': token('none', {
    name: 'popover-position-area',
    state: [
      [anchored, 'bottom'],
      [top, 'top'],
      [right, 'right'],
      [left, 'left'],
    ],
  }),
  'position-try-fallbacks': token('flip-block', {
    name: 'popover-position-fallback',
    state: [
      [right, 'flip-inline'],
      [left, 'flip-inline'],
    ],
  }),
  'container-type': 'anchored',
  'anchor-name': '--popover-surface',
  'anchor-scope': '--popover-surface',
  'opacity': token(0, {
    name: 'popover-opacity',
    state: [[stateCondition('&:popover-open'), 1]],
  }),
  'transition':
    'opacity 180ms ease, overlay 180ms ease allow-discrete, display 180ms ease allow-discrete',
})

// 只量取坐标差，不承载内容尺寸或材质；未用到的轴可自然收缩为零。
const paintOutset = multiply(arrowHalfSize, -1)
rules([surface, '.PopoverGeometry'], {
  'position': 'fixed',
  'position-anchor': 'inherit',
  'left': add('anchor(--popover-surface left)', paintOutset),
  'top': add('anchor(--popover-surface top)', paintOutset),
  'right': 'anchor(center)',
  'bottom': 'anchor(center)',
  'container-type': 'size',
  'pointer-events': 'none',
  'z-index': -1,
})

const paint = [surface, '.PopoverPaint']
rules(paint, {
  'pointer-events': 'auto',
  'position': 'fixed',
  'position-anchor': 'inherit',
  'left': add('anchor(--popover-surface left)', paintOutset),
  'right': add('anchor(--popover-surface right)', paintOutset),
  'top': add('anchor(--popover-surface top)', paintOutset),
  'bottom': add('anchor(--popover-surface bottom)', paintOutset),
  'background': popoverBackground,
  'border': popoverBorder,
  'box-shadow': popoverShadow,
  'border-shape': token(() => outline, {
    name: 'popover-outline',
    address: paint,
    state: [
      [flipBlock, blockFallbackOutline],
      [flipInline, inlineFallbackOutline],
    ],
  }),
})
