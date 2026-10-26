/**
 * 时间线动画的属性目标。
 *
 * 统一动画效果、时间参数、滚动/视图时间线及触发范围；运动路径几何另有归属。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $animation = key('animation')

export const $animationComposition = key('animation-composition')

export const $animationDelay = key('animation-delay')

export const $animationDirection = key('animation-direction')

export const $animationDuration = key('animation-duration')

export const $animationFillMode = key('animation-fill-mode')

export const $animationIterationCount = key('animation-iteration-count')

export const $animationName = key('animation-name')

export const $animationPlayState = key('animation-play-state')

export const $animationRange = key('animation-range')

export const $animationRangeEnd = key('animation-range-end')

export const $animationRangeStart = key('animation-range-start')

export const $animationTimeline = key('animation-timeline')

export const $animationTimingFunction = key('animation-timing-function')

export const $animationTrigger = key('animation-trigger')

export const $timelineTrigger = key('timeline-trigger')

export const $timelineTriggerActivationRange = key(
  'timeline-trigger-activation-range',
)

export const $timelineTriggerActivationRangeEnd = key(
  'timeline-trigger-activation-range-end',
)

export const $timelineTriggerActivationRangeStart = key(
  'timeline-trigger-activation-range-start',
)

export const $timelineTriggerActiveRange = key('timeline-trigger-active-range')

export const $timelineTriggerActiveRangeEnd = key(
  'timeline-trigger-active-range-end',
)

export const $timelineTriggerActiveRangeStart = key(
  'timeline-trigger-active-range-start',
)

export const $timelineTriggerName = key('timeline-trigger-name')

export const $timelineTriggerSource = key('timeline-trigger-source')

export const $triggerScope = key('trigger-scope')

export const $scrollTimeline = key('scroll-timeline')

export const $scrollTimelineAxis = key('scroll-timeline-axis')

export const $scrollTimelineName = key('scroll-timeline-name')

export const $timelineScope = key('timeline-scope')

export const $viewTimeline = key('view-timeline')

export const $viewTimelineAxis = key('view-timeline-axis')

export const $viewTimelineInset = key('view-timeline-inset')

export const $viewTimelineName = key('view-timeline-name')

/** 时间线动画的 CSS 原名与具名 Key 对应表。 */
export const animationKeys = {
  'animation': $animation,
  'animation-composition': $animationComposition,
  'animation-delay': $animationDelay,
  'animation-direction': $animationDirection,
  'animation-duration': $animationDuration,
  'animation-fill-mode': $animationFillMode,
  'animation-iteration-count': $animationIterationCount,
  'animation-name': $animationName,
  'animation-play-state': $animationPlayState,
  'animation-range': $animationRange,
  'animation-range-end': $animationRangeEnd,
  'animation-range-start': $animationRangeStart,
  'animation-timeline': $animationTimeline,
  'animation-timing-function': $animationTimingFunction,
  'animation-trigger': $animationTrigger,
  'timeline-trigger': $timelineTrigger,
  'timeline-trigger-activation-range': $timelineTriggerActivationRange,
  'timeline-trigger-activation-range-end': $timelineTriggerActivationRangeEnd,
  'timeline-trigger-activation-range-start':
    $timelineTriggerActivationRangeStart,
  'timeline-trigger-active-range': $timelineTriggerActiveRange,
  'timeline-trigger-active-range-end': $timelineTriggerActiveRangeEnd,
  'timeline-trigger-active-range-start': $timelineTriggerActiveRangeStart,
  'timeline-trigger-name': $timelineTriggerName,
  'timeline-trigger-source': $timelineTriggerSource,
  'trigger-scope': $triggerScope,
  'scroll-timeline': $scrollTimeline,
  'scroll-timeline-axis': $scrollTimelineAxis,
  'scroll-timeline-name': $scrollTimelineName,
  'timeline-scope': $timelineScope,
  'view-timeline': $viewTimeline,
  'view-timeline-axis': $viewTimelineAxis,
  'view-timeline-inset': $viewTimelineInset,
  'view-timeline-name': $viewTimelineName,
}
