import { createStatusRecord } from '../utils/status'
import { createPivPlugin } from '../kits/Piv'
import { hoverable } from './hoverable'

/**
 * [Plugin]
 * 可 click，并提供 focus 与 tab 键盘导航的能力
 *
 * 继承自 {@link hoverable}
 */

export function clickable(options?: { componentName?: string }) {
  // 用于管理Button的组件的内部交互状态
  const [interactionStatus, interactionStatusActions] = createStatusRecord<'focus' | 'pressed'>()
  const interactionStatusFocus = hoverable(options)
  const plugin = createPivPlugin(() => ({
    htmlProps: {
      tabIndex: 0,
      'data-plugin': { mergable: clickable.name },
    },
    plugins: [interactionStatusFocus.plugin],
    on: {
      focusin: () => interactionStatusActions.setStatus('focus', true),
      focusout: () => interactionStatusActions.setStatus('focus', false),
      pointerdown: () => interactionStatusActions.setStatus('pressed', true),
      pointerup: () => interactionStatusActions.setStatus('pressed', false),
      keyup: ({ event, element }) => {
        if ((event.target as HTMLElement).nodeName === 'button') return undefined // 原生用内置button的本来就有点支持了，我们就没有必要多此一举了
        if (event.key === 'Enter' || event.key === ' ') {
          element.click() // 让键盘事件也能触发点击行为，提升键盘操作的体验
        }
      },
    },
  }))
  return { details: interactionStatus, plugin }
}
