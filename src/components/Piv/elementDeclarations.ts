/**
 * 上层组件交给真实根元素的补充声明。
 *
 * 承接根样式和原生属性，真实元素按来源优先级消费后终止向子内容传递。
 *
 * 让无额外 DOM 的组件组合共用既有绑定能力，同时保持后代声明独立。
 */
import { createContext } from '@/foundation'
import type { HTMLPropsList } from './handleHTMLProps'
import type { StyleList } from './handleStyle'

/** 上层提供的根声明，复用既有 DOM 字段消费链。 */
export interface ElementDeclarations {
  style?: StyleList
  htmlProps?: HTMLPropsList
}

/** 同根组合按低到高优先级排列；真实元素自己的声明优先。 */
export const ElementDeclarationsContext = createContext<ElementDeclarations[]>(
  [],
)
