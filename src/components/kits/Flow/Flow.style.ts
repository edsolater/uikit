/**
 * 顺序内容流的排列样式。
 *
 * 保持实例指定间距，按自身方向与伸展状态安排空间。
 *
 * 分栏和子组件外观由各自主体负责。
 */
import { rules, token } from '@/style-system'
import type { StyleConfig } from '../../tools/styleConfig'
import { componentName } from './Flow.prop'

/** Flow 的应用配置契约；省略字段沿用各 Token 自有默认。 */
export interface FlowStyleConfig {
  /** 子项间距，接受 CSS gap 值。 */
  $gap?: string
  /** 容器自身宽度，省略时由父布局与内容决定。 */
  $width?: string
  /** 默认横排换行并居中，必要时明确选择纵排。 */
  $direction?: 'row' | 'column'
  /** 在父级弹性布局中占用剩余空间。 */
  $grow?: boolean
}

/** 实例只提交差异，默认横排和自然宽度仍由各 Token 唯一拥有。 */
export const flowStyleConfig = {
  /**
   * 设置当前实例子项之间的间距。
   */
  $gap: (value) => flowGap.set(value),
  /**
   * 设置当前实例自身宽度。
   */
  $width: (value) => flowWidth.set(value),
  /**
   * 纵排时统一安排方向、换行与交叉轴；横排沿用 Token 默认。
   */
  $direction: (value) => {
    if (value === 'column') {
      direction.set('column')
      wrap.set('nowrap')
      alignment.set('normal')
    }
  },
  /**
   * 需要时占用父级剩余空间，否则沿用自然尺寸。
   */
  $grow: (value) => {
    if (value) flex.set('1')
  },
} satisfies StyleConfig<FlowStyleConfig>

const direction = token('row', { name: 'flow-direction' })
const wrap = token('wrap', { name: 'flow-wrap' })
const alignment = token('center', { name: 'flow-alignment' })
const flex = token('initial', { name: 'flow-flex' })
/** 子项的默认间距，实例配置只覆盖当前根的取值。 */
export const flowGap = token('1rem', { name: 'flow-gap' })
/** 容器的默认自然宽度，实例配置清空后恢复此值。 */
export const flowWidth = token('auto', { name: 'flow-width' })

rules(`.${componentName}`, {
  'display': 'flex',
  'flex-direction': direction,
  'flex-wrap': wrap,
  'align-items': alignment,
  'gap': flowGap,
  'min-width': '0',
  'width': flowWidth,
  flex,
})
