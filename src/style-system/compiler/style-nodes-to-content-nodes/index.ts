/** JSS 样式节点内容编译领域的公开入口。
 *
 * 汇总内容编译能力及其结果契约。
 *
 * 让使用方从领域取得契约，由具体文件承担编译责任。
 */
export { styleNodesToContentNodes } from './compilation'
export type { JSSContentNode } from './node-compilation'
