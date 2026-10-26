/**
 * CSS scroll-driven-animations 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- scroll 属性族 ---

export const $scrollTimeline = key('scroll-timeline')

export const $scrollTimelineAxis = key('scroll-timeline-axis')

export const $scrollTimelineName = key('scroll-timeline-name')

// --- timeline 属性族 ---

export const $timelineScope = key('timeline-scope')

// --- view 属性族 ---

export const $viewTimeline = key('view-timeline')

export const $viewTimelineAxis = key('view-timeline-axis')

export const $viewTimelineInset = key('view-timeline-inset')

export const $viewTimelineName = key('view-timeline-name')

/** scroll-driven-animations 模块的 CSS 原名与具名 Key 对应表。 */
export const scrollDrivenAnimationsKeys = {
  'scroll-timeline': $scrollTimeline,
  'scroll-timeline-axis': $scrollTimelineAxis,
  'scroll-timeline-name': $scrollTimelineName,
  'timeline-scope': $timelineScope,
  'view-timeline': $viewTimeline,
  'view-timeline-axis': $viewTimelineAxis,
  'view-timeline-inset': $viewTimelineInset,
  'view-timeline-name': $viewTimelineName,
}
