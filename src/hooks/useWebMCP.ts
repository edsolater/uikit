/**
 * 组件作用域内的 WebMCP 工具接入。
 *
 * 负责向当前 document 注册工具，并在所属组件作用域释放时注销。
 *
 * 让页面功能直接成为 Agent 可调用的工具；具体功能由调用方提供。
 */
import { onCleanup } from '@/foundation'

/** WebMCP 工具的发现信息、参数描述与执行入口。 */
export type WebMCPTool<Input extends object = Record<string, unknown>> = {
  name: string
  description: string
  /** 参数的 JSON Schema；省略时工具不要求参数。 */
  inputSchema?: Record<string, unknown>
  /** 执行页面功能并返回可 JSON 序列化的结果，支持异步结果。 */
  execute: (input: Input, options: { signal: AbortSignal }) => unknown
}

/**
 * 在 App.tsx 中统一注册应用对 Agent 暴露的工具，随 App 作用域释放自动注销。
 * 功能必须先向 App 暴露可调用的入口，再由 execute 通过闭包调用；App 无法调用的功能尚未完成能力暴露。
 * 内部组件不自行注册工具，应用的对外能力由 App 集中掌控。
 * 在 App 构建期间调用；浏览器不支持 WebMCP 时跳过注册并返回已完成 Promise，否则返回原生注册完成 Promise。
 */
export function useWebMCP<Input extends object>(tool: WebMCPTool<Input>): Promise<void> {
  if (!('modelContext' in document)) return Promise.resolve()
  const controller = new AbortController()
  onCleanup(() => controller.abort())

  const { modelContext } = document as Document & {
    modelContext: {
      registerTool: (tool: WebMCPTool<Input>, options: { signal: AbortSignal }) => Promise<void>
    }
  }

  return modelContext.registerTool(tool, { signal: controller.signal })
}
