/** CSS 函数定义主体。
 *
 * 保存函数签名与定义体，并构造依赖该主体的调用表达式。
 *
 * 定义只在调用被消费时进入编译，调用本身只组织实参与输出。
 */
import { createJSSContent, type Expression, type JSSContent } from './content'
import { functionDefinition } from './condition'
import type { Rules } from './rule'
import type { ValueInput } from './value'

/** 可调用的定义主体；对象身份用于共享依赖，CSS 名称由签名决定。 */
export interface CSSFunction extends JSSContent {
  (...args: ValueInput[]): Expression
  /** 此主体保存的完整定义，只在编译消费时提供。 */
  onActive: NonNullable<JSSContent['onActive']>
}

/**
 * 定义 CSS 函数；每次调用返回依赖同一主体的 Expression，按需提供完整函数体。
 * @example
 * const double = cssFunction('--double(--n <number>)', [[[], 'result', 'calc(var(--n) * 2)']])
 * double(3) // 消费时提供 @function 定义，并输出 --double(3)。
 */
export function cssFunction(signature: string, body: Rules): CSSFunction {
  const name = signature.split('(')[0].trim()
  const definition: Rules = [[[functionDefinition(signature)], undefined, body]]
  const subject: CSSFunction = Object.assign((...args: ValueInput[]) =>
    createJSSContent((resolve) => {
      const parts = args.map(resolve)
      return parts.some((part) => part === undefined) ? undefined : `${name}(${parts.join(', ')})`
    }, [subject, ...args]), { onActive: () => definition })
  return subject
}
