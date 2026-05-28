import { createStatusRecord } from '../component-utils/status'
import { createPivPlugin } from '../components/BasicPiv'

/**
 * [Plugin]
 * 用于感知内部状态
 *
 * 提供 hover、active 的感知能力
 */

export function interactivable(options?: { componentName?: string }) {
  // 用于管理Button的组件的内部交互状态
  const [interactionStatus, interactionStatusActions] = createStatusRecord<'hover' | 'active'>()
  const plugin = createPivPlugin(() => ({
    htmlProps: {
      tabIndex: 0,
      'data-plugin': interactivable.name,
    },
    on: {
      pointerover: () => interactionStatusActions.setStatus('hover', true),
      pointerdown: () => interactionStatusActions.setStatus('active', true),
      pointerleave: () => interactionStatusActions.setStatus('hover', false),
      pointerup: () => interactionStatusActions.setStatus('active', false),
    },
  }))
  return { details: interactionStatus, plugin }
}
