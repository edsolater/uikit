/**
 * 消息反馈信息体。
 *
 * 将反馈内容交给 Board 承载，按语气提供通知或警报语义。
 *
 * 消息意义与底层材质分离，不复制承载实现。
 */
import { kit } from '@/components/utils/kit'
import type { PropsController } from '@/components/utils/componentPropsDirector'
import type { RefReceiver } from '@/hooks/createRef'
import { messageBoardPropsDefinition } from './MessageBoard.prop'
import type { ComponentDescriptionProps } from '@/components/ComponentMarker/ComponentMarker'
import { derive } from '@/hooks/stateUtils'
import { type Source, type JSX } from '@/foundation'
import { Board } from '../Board/Board'
import './MessageBoard.style'
/** MessageBoard 的声明输入；初始状态通过 Props 表达。 */
export type MessageBoardProps = ComponentDescriptionProps & {
  ref?: RefReceiver<MessageBoardController>
  tone?: Source<'info' | 'success' | 'warning' | 'error' | undefined>
  children?: JSX.Element
}

/** MessageBoard 自有 Props 的指令式入口；ref 只从上游交付。 */
export type MessageBoardController = PropsController<MessageBoardProps, typeof messageBoardPropsDefinition>

/**
 * 面向操作结果的可访问反馈，不承担普通内容卡片职责。
 */
export const MessageBoard = kit(
  {
    name: 'MessageBoard',
    description: '呈现操作结果反馈',
    availableProps: messageBoardPropsDefinition,
  },
  (props: MessageBoardProps) => {
    return (
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
    )
  },
)
