/**
 * MessageBoard 的结果反馈示例。
 *
 * 展示信息、成功、警告和错误四类有明确文字的反馈。
 *
 * 让使用者区分反馈语义，不依赖颜色猜测结果。
 */
import { Flow, MessageBoard, Text } from '@/components'
/**
 * 并列展示四种反馈语气及其对应信息。
 */
export function MessageBoardExample() {
  return (
    <Flow>
      <Text>一级消息信息体由零点五级 Board 承载；Board 提供材质，不另立信息单元。</Text>
      <MessageBoard>正在读取当前记录。</MessageBoard>
      <MessageBoard tone="success">记录已保存。</MessageBoard>
      <MessageBoard tone="warning">资料尚未核对完整。</MessageBoard>
      <MessageBoard tone="error">未能读取文件，请检查实际路径。</MessageBoard>
    </Flow>
  )
}
