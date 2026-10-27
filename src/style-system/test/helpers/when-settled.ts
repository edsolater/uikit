/**
 * 编译流程测试的一次稳定后改写。
 *
 * 每次 onCompile 独立等待改写成功，不跨会话保存完成状态。
 *
 * 共享等待与重访控制，让各案例只描述需要发生的队列变化。
 */

import type { JSSContent } from '../../content'
import type { ASTController } from '../../compiler/contracts'

/**
 * 每次稳定核验尝试改写；change 返回 true 才完成一次，
 * false 必须保持队列不变并继续等待。
 */
export function whenSettled(
  change: (controller: ASTController) => boolean,
): JSSContent {
  return {
    onCompile(_context, controller) {
      let done = false
      controller.addSettlementCheck(() => {
        if (done) return false
        done = change(controller)
        return done
      })
    },
  }
}
