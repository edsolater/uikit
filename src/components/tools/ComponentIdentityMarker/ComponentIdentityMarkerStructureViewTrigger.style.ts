/** 组件身份结构查看激活器的浮动位置；按钮本身的外观与交互由 Button 承担。 */
import { rules, token } from '@/style-system'

/** 激活器距视口右侧和底部的共同距离。 */
export const componentIdentityMarkerStructureViewTriggerOffset = token('24px', {
  name: 'component-identity-marker-structure-view-trigger-offset',
})

rules('.ComponentIdentityMarkerStructureViewTrigger', {
  'position': 'fixed',
  'right': componentIdentityMarkerStructureViewTriggerOffset,
  'bottom': componentIdentityMarkerStructureViewTriggerOffset,
  'z-index': 2147483647,
  'border-radius': '999px',
  'min-height': '44px',
  'box-shadow': '0 4px 18px #23303d33',
})
