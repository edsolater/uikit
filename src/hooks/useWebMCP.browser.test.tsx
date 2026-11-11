/**
 * WebMCP 工具的组件作用域验收。
 *
 * 使用原生组件运行时验证闭包访问、最新状态与卸载注销。
 *
 * 浏览器注册接口由测试替身提供，不代替 WebMCP 原生实现验收。
 */
import { flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
import { createContext, createState, render, useContext } from '@/foundation'
import { useWebMCP, type WebMCPTool } from './useWebMCP'

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  Reflect.deleteProperty(document, 'modelContext')
  document.body.replaceChildren()
})

test('工具读取组件上下文与最新状态，并随组件卸载注销', async () => {
  const tools = new Map<string, WebMCPTool<{ increment: number }>>()
  const modelContext = {
    registerTool: async (
      tool: WebMCPTool<{ increment: number }>,
      options: { signal: AbortSignal },
    ) => {
      tools.set(tool.name, tool)
      options.signal.addEventListener('abort', () => tools.delete(tool.name))
    },
  }
  Object.defineProperty(document, 'modelContext', {
    configurable: true,
    value: modelContext,
  })

  const Context = createContext<string>()
  const count = createState(0)
  let registered: Promise<void>

  /**
   * 在当前组件上下文暴露计数操作，供组件外部调用。
   */
  function Counter() {
    const label = useContext(Context)
    registered = useWebMCP<{ increment: number }>({
      name: 'increment',
      description: '增加计数并返回所属页面与更新前计数',
      inputSchema: {
        type: 'object',
        properties: { increment: { type: 'number' } },
      },
      execute: ({ increment }, { signal }) => {
        const previousCount = count.read()
        count.set(previousCount + increment)
        return { label, previousCount, signal }
      },
    })
    return <span>{count.read()}</span>
  }

  const host = document.body.appendChild(document.createElement('main'))
  dispose = render(
    () => (
      <Context value="当前页面">
        <Counter />
      </Context>
    ),
    host,
  )
  await registered!
  expect([...tools.keys()]).toEqual(['increment'])

  count.set(7)
  flush()
  const signal = new AbortController().signal
  expect(
    await tools.get('increment')!.execute({ increment: 2 }, { signal }),
  ).toEqual({ label: '当前页面', previousCount: 7, signal })
  flush()
  expect(host.textContent).toBe('9')

  dispose()
  dispose = undefined
  expect(tools.size).toBe(0)
})
