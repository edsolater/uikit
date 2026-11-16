/**
 * 消息反馈信息体。
 *
 * 将反馈内容交给 Board 承载，按语气提供通知或警报语义。
 *
 * 消息意义与底层材质分离，不复制承载实现。
 */
import { Board } from '../Board/Board'
import { kit, type KitComponent } from '../../tools/kit'
import {
  componentName,
  messageBoardPropDefinition,
  type MessageBoardProps,
  type MessageBoardController,
} from './MessageBoard.prop'
import { derive } from '@/hooks/stateUtils'

import './MessageBoard.style'

/**
 * 面向操作结果的可访问反馈，不承担普通内容卡片职责。
 */
export const MessageBoard: KitComponent<{
  props: MessageBoardProps
  controller: MessageBoardController
}> = kit(
  {
    name: componentName,
    description: '呈现操作结果反馈',
    propDefinition: messageBoardPropDefinition,
  },
  (props, { name }) => {
    return (
      <Board
        shadowProps={props}
        small
        class={name}
        htmlProps={{
          'data-tone': props.tone,
          'role': derive(props.tone, (tone) =>
            tone === 'error' ? 'alert' : 'status',
          ),
        }}
      >
        {props.children}
      </Board>
    )
  },
)
