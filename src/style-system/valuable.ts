/** 可编译内容与按需依赖。 */
import type { ConditionPath } from './condition'
import type { CSSKey } from './css-key'
import type { Rules } from './rule'
import type { ASTController } from './compiler/ast-controller'
import type { CSSOutputContent } from './compiler/style-nodes'
import type { ValueInput } from './value'

/** 当前消费地址。 */
export interface CompileContext {
  root: Rules
  path: ConditionPath
  key?: CSSKey
}

/** 可被 CSS 化的对象；使用时按需提供根地址依赖。 */
export interface Valuable {
  onActive?: (context: CompileContext) => Rules | void
}

/** Content 通过自身的解析行为接入当前编译队列。 */
export interface ASTParseable {
  parseWaveIndex?: number
  contents?: ValueInput[]
  parse(astController: ASTController): ValueInput | CSSOutputContent
}
