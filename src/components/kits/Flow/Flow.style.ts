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
  /** 容器自身高度；固定阅读区域时可配合纵向滚动。 */
  $height?: string
  /** 超出自身高度的内容如何呈现，auto 保留完整内容并按需滚动。 */
  $overflowY?: 'visible' | 'auto' | 'scroll' | 'hidden' | 'clip'
  /** 默认横排换行并居中，必要时明确选择纵排。 */
  $direction?: 'row' | 'column'
  /** 启用横排快捷方式；同层具体方向优先。 */
  $row?: boolean
  /** 启用纵排快捷方式；同层多个快捷按输入出现顺序后者优先。 */
  $col?: boolean
  /** 在父级弹性布局中占用剩余空间。 */
  $grow?: boolean
}

/** 实例只提交差异，默认横排和自然宽度仍由各 Token 唯一拥有。 */
export const flowStyleConfig = {
  /**
   * 设置当前实例子项之间的间距。
   */
  $gap: value => flowGap.set(value),
  /**
   * 设置当前实例自身宽度。
   */
  $width: value => flowWidth.set(value),
  /**
   * 设置当前实例自身高度。
   */
  $height: value => flowHeight.set(value),
  /**
   * 设置当前实例纵向溢出的呈现方式。
   */
  $overflowY: value => flowOverflowY.set(value),
  /**
   * 纵排统一安排方向、换行与交叉轴；横排沿用 Token 默认。
   */
  $direction: value => {
    if (value === 'column') {
      direction.set('column')
      wrap.set('nowrap')
      alignment.set('normal')
    }
  },
  $row: { $direction: 'row' },
  $col: { $direction: 'column' },
  /**
   * 需要时占用父级剩余空间，否则沿用自然尺寸。
   */
  $grow: value => {
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
/** 容器默认随内容自然增高。 */
export const flowHeight = token('auto', { name: 'flow-height' })
/** 默认完整呈现超出容器的内容，实例可选择内部滚动。 */
export const flowOverflowY = token('visible', { name: 'flow-overflow-y' })

rules(`.${componentName}`, {
  'display': 'flex',
  'flex-direction': direction,
  'flex-wrap': wrap,
  'align-items': alignment,
  'gap': flowGap,
  'min-width': '0',
  'width': flowWidth,
  'height': flowHeight,
  'overflow-y': flowOverflowY,
  flex,
})
