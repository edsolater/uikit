/**
 * 滚动导航目标的属性目标。
 *
 * 组织滚动标记组、活动目标组与初始目标。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $scrollMarkerGroup = key('scroll-marker-group')

export const $scrollTargetGroup = key('scroll-target-group')

export const $scrollInitialTarget = key('scroll-initial-target')

/** 滚动导航目标的 CSS 原名与具名 Key 对应表。 */
export const scrollNavigationKeys = {
  'scroll-marker-group': $scrollMarkerGroup,
  'scroll-target-group': $scrollTargetGroup,
  'scroll-initial-target': $scrollInitialTarget,
}
