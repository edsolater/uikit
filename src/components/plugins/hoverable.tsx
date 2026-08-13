import { createStatusRecord } from '../utils/status'
import { createPivPlugin } from '../kits/Piv'

/**
 * [Plugin]
 * 用于感知内部状态
 *
 * 提供 hover、active 的感知能力
 */

export function hoverable(options?: { componentName?: string }) {
  // 用于管理Button的组件的内部交互状态
  const [interactionStatus, interactionStatusActions] = createStatusRecord<'hover'>()
  const plugin = createPivPlugin(() => ({
    htmlProps: {
      'data-plugin': { mergable: hoverable.name },
    },
    on: {
      pointerover: () => interactionStatusActions.setStatus('hover', true),
      pointerleave: () => interactionStatusActions.setStatus('hover', false),
    },
  }))
  return { details: interactionStatus, plugin }
}
