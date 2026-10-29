/**
 * 消息反馈信息体。
 *
 * 将反馈内容交给 Board 承载，按语气提供通知或警报语义。
 *
 * 消息意义与底层材质分离，不复制承载实现。
 */
import {
  ComponentMarker,
  type ComponentDescriptionProps,
} from '@/components/ComponentMarker/ComponentMarker'
import { derive } from '@/hooks/stateUtils'
import { type Source, type JSX } from '@/foundation'
import { Board } from '../Board/Board'
import './MessageBoard.style'
/**
 * 面向操作结果的可访问反馈，不承担普通内容卡片职责。
 */
export function MessageBoard(
  props: ComponentDescriptionProps & {
    tone?: Source<'info' | 'success' | 'warning' | 'error'>
    children?: JSX.Element
  },
) {
  return (
    <ComponentMarker
      componentName="MessageBoard"
      defaultDescription="呈现操作结果反馈"
      description={props.description}
      descriptionDisplay={props.descriptionDisplay}
    >
      <Board
        small
        class="MessageBoard"
        htmlProps={{
          'data-tone': props.tone,
          role: derive(props.tone, (tone) =>
            tone === 'error' ? 'alert' : 'status',
          ),
        }}
      >
        {props.children}
      </Board>
    </ComponentMarker>
  )
}
