/**
 * tabularNum 让动态数字使用等宽数字。
 *
 * 能力：给 Piv 自动补充 `trait:tabular-num` 功能类，并随插件引入对应 CSS。
 *
 * 适用场景：计时器、计数器、价格、百分比、比分和实时数据这类会更新的数字。
 *
 * 示例：
 *
 * ```tsx
 * import { Piv, tabularNum } from '@edsolater/uikit'
 *
 * <Piv class="timer" trait={tabularNum}>
 *   {elapsedTime()}
 * </Piv>
 *
 * 业务层不应手写 `<Piv class="timer trait:tabular-num">`；
 * trait plugin 负责把语义能力翻译成真实 DOM class。
 * ```
 */
import type { PivTag } from '../../components/Piv/domMap'
import type { PivPlugin } from '../../components/Piv'
import './tabular-num.css'

export const tabularNum: PivPlugin<PivTag> = () => ({
  class: 'trait:tabular-num',
})
