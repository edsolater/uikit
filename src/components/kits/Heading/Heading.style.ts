/**
 * Heading 的标题层级与结构查看样式。
 *
 * 按标题层级调整上下间距，定位框开启时隐藏文字像素并保留排版。
 *
 * 让标题保持文档阅读节奏，结构查看沿用同一内容和布局。
 */
import { componentName } from './Heading.prop'
import { rules, token, stateCondition } from '@/style-system'

const headingBlockMargin = token('2.4em 1.2em', {
  name: 'heading-block-margin',
  state: [
    [stateCondition('&:is(h2)'), '2em 1em'],
    [stateCondition('&:is(h3)'), '1.6em .8em'],
    [stateCondition('&:is(h4)'), '1.4em .7em'],
  ],
})

rules(`.${componentName}`, {
  'margin-block': headingBlockMargin,
  'visibility': token('inherit', {
    name: 'heading-visibility',
    state: [
      [
        stateCondition('body:has(.StructureViewOverlay:popover-open) &'),
        'hidden',
      ],
    ],
  }),
})
