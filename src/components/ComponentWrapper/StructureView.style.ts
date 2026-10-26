/**
 * 组件定位框的浮动入口、独立显示层及模式内透明规则。
 *
 * 逐项保留定位、文字裁切与原生浮层行为，不参与原内容布局。
 */
import { key, rules } from '@/style-system'

rules(
  ['.StructureViewFab'],
  [
    [key('position'), 'fixed'],
    [key('right'), '24px'],
    [key('bottom'), '24px'],
    [key('z-index'), 2147483647],
    [key('border-radius'), '999px'],
    [key('min-height'), '44px'],
    [key('box-shadow'), '0 4px 18px #23303d33'],
  ],
)

rules(
  ['.StructureViewOverlay'],
  [
    [key('position'), 'fixed'],
    [key('inset'), 0],
    [key('width'), '100vw'],
    [key('height'), '100vh'],
    [key('max-width'), 'none'],
    [key('max-height'), 'none'],
    [key('margin'), 0],
    [key('padding'), 0],
    [key('border'), 0],
    [key('background'), 'transparent'],
    [key('opacity'), 1],
    [key('transform'), 'none'],
    [key('transition'), 'none'],
    [key('overflow'), 'hidden'],
    [key('pointer-events'), 'none'],
  ],
)

rules(['.StructureViewOverlay::backdrop'], [[key('display'), 'none']])

rules(
  ['.StructureViewOverlay > canvas'],
  [
    [key('position'), 'absolute'],
    [key('z-index'), 1],
    [key('inset'), 0],
    [key('width'), '100%'],
    [key('height'), '100%'],
    [key('max-width'), 'none'],
    [key('max-height'), 'none'],
  ],
)

rules(
  ['.StructureViewOverlay > .frame'],
  [
    [key('position'), 'absolute'],
    [key('isolation'), 'isolate'],
  ],
)

rules(
  ['.StructureViewOverlay > .frame::before'],
  [
    [key('content'), '""'],
    [key('position'), 'absolute'],
    [key('inset'), 0],
    [key('z-index'), -1],
    [key('background'), 'rgb(255 255 255 / 90%)'],
    [key('backdrop-filter'), 'blur(4px)'],
    [key('clip-path'), 'var(--structure-view-mask-clip, none)'],
  ],
)

rules(
  ['.StructureViewOverlay .labels'],
  [
    [key('max-height'), '100%'],
    [key('overflow'), 'hidden'],
  ],
)

rules(
  ['.StructureViewOverlay .label'],
  [
    [key('display'), 'block'],
    [key('box-sizing'), 'border-box'],
    [key('max-width'), '100%'],
    [key('padding'), '1px 6px'],
    [key('color'), '#263645'],
    [key('font'), '11px/16px system-ui, sans-serif'],
    [key('white-space'), 'normal'],
    [key('overflow-wrap'), 'anywhere'],
    [key('overflow'), 'hidden'],
  ],
)

rules(['[data-structure-view-hidden]'], [[key('opacity'), '0 !important']])
rules(
  ['::highlight(uikit-structure-view-hidden)'],
  [[key('color'), 'transparent']],
)
