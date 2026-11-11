/** 标题按文档层级留出上下空间，定位框只隐藏文字而保留排版。 */
import { rules, token, stateCondition } from '@/style-system'

const headingBlockMargin = token('2.4em 1.2em', {
  name: 'heading-block-margin',
  state: [
    [stateCondition('&:is(h2)'), '2em 1em'],
    [stateCondition('&:is(h3)'), '1.6em .8em'],
    [stateCondition('&:is(h4)'), '1.4em .7em'],
  ],
})

rules('.Heading', {
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
