/** 结构查看激活器的浮动位置；按钮本身的外观与交互由 Button 承担。 */
import { rules, token } from '@/style-system'

/** 激活器距视口右侧和底部的共同距离。 */
export const componentMarkerStructureViewTriggerOffset = token('24px', {
  name: 'component-marker-structure-view-trigger-offset',
})

rules('.ComponentMarkerStructureViewTrigger', {
  position: 'fixed',
  right: componentMarkerStructureViewTriggerOffset,
  bottom: componentMarkerStructureViewTriggerOffset,
  'z-index': 2147483647,
  'border-radius': '999px',
  'min-height': '44px',
  'box-shadow': '0 4px 18px #23303d33',
})
