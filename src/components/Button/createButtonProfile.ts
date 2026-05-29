/**
 * 这个文件定义 Button 固有画像能力。
 * 它负责管理 tone、intent、scale、type 这些不随运行状态改变的 Button 身份信息。
 * 当前实现会产出 data-* attribute 和原生状态 attribute，但这些只是 profile 的底层消费方式。
 */
import { createStatusRecord, type StatusInput } from '../../component-utils/status'
import { val, type Source } from '../../hooks'
import { createPivPlugin } from '../BasicPiv/plugin/helpers'

export interface ProfileProps {
  tone?: Source<any>
  intent?: Source<any>
  spacing?: Source<any>
  name?: Source<any>
  status?: StatusInput<any>
}

export function createUIKitProfile<P extends ProfileProps>(props: P) {
  // 状态驱动。外部传入的业务态和内部派生态在 manager 内部融合。
  const [statusRecord, statusRecordActions] = createStatusRecord(props.status)

  const details = {
    tone: props.tone as P['tone'],
    intent: props.intent as P['intent'],
    spacing: props.spacing as P['spacing'],
    name: props.name as P['name'],
    status: statusRecord,
  } as const

  const plugin = createPivPlugin(() => ({
    htmlProps: {
      disabled: statusRecord.map((record) => record['disabled']),
      'aria-busy': statusRecord.map((record) => record['loading']),

      'aria-label': props.name,
      'data-tone': props.tone,
      'data-intent': props.intent,
      'data-spacing': props.spacing,
      'data-status': statusRecord.map((record) => toStatusAttributeValue(record)),
    },
  }))

  return [details, plugin] as const
}

/**
 * 把状态对象转换成 data-status 需要的 token 字符串。
 * @param from {disable:ture, hidden:false}
 * @returns 'disable loading'
 */
function toStatusAttributeValue<S extends string>(from: Record<S, Source<boolean>>): string | undefined {
  const statusTokens: S[] = []
  for (const key in from) {
    if (val(from[key])) {
      statusTokens.push(key)
    }
  }

  return statusTokens.length > 0 ? statusTokens.join(' ') : undefined
}
