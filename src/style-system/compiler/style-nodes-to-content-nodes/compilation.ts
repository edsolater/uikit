/** JSS 样式节点的内容编译流程。
 *
 * 逐波推进节点、资源与连接，交付可输出的内容节点。
 *
 * 让可改写的声明完成全部内容行为后再进入 CSS 输出。
 */
import { assert } from '@edsolater/fnkit'
import type { Rules } from '../../rule'
import type { JSSStyleNode } from '../rules-to-style-nodes'
import { createASTController, ASTSession } from '../ast-controller'
import { ResourceCompilation } from './resource-compilation'
import { Join } from './join'
import { NodeCompilation, type JSSContentNode } from './node-compilation'

/** 逐波编译可改写队列；接入按需资源并稳定连接后交付有序内容节点。 */
export function styleNodesToContentNodes(styleNodes: JSSStyleNode[], sourceRules: Rules): JSSContentNode[] {
  const session = new ASTSession(styleNodes)
  const resources = new ResourceCompilation(session)
  const nodes = new NodeCompilation(session, createASTController(session), sourceRules, resources)
  const join = new Join(session, (node) => nodes.resolvedContents(node))
  for (let wave = 0; ; wave++) {
    assert(wave <= 10_000, 'AST 编译波超过上限 10000，Content 仍未完成。')
    nodes.visit(wave)
    resources.publish()
    if (!nodes.settle()) continue
    if (join.update()) continue
    return nodes.outputs((node) => join.isOutput(node))
  }
}
