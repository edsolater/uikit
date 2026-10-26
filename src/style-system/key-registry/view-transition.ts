/**
 * 视图快照过渡的属性目标。
 *
 * 声明快照配对身份及作用域，不把普通属性过渡混入这一生命周期。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $viewTransitionClass = key('view-transition-class')

export const $viewTransitionName = key('view-transition-name')

export const $viewTransitionScope = key('view-transition-scope')

/** 视图快照过渡的 CSS 原名与具名 Key 对应表。 */
export const viewTransitionKeys = {
  'view-transition-class': $viewTransitionClass,
  'view-transition-name': $viewTransitionName,
  'view-transition-scope': $viewTransitionScope,
}
