import { PropsWithChildren } from 'react'

/**
 * 移动距离
 */
export type Delta2dTranslate = {
  // distance in x (px)
  dx: number
  // distance in y (px)
  dy: number
}

/**
 * 水平、垂直同步放大
 */
export type Delta2dScale = {
  // 水平放大倍数
  scaleRate: number
}

/**
 * 纯向量
 */
export type Vector = {
  // 向量x
  x: number
  // 向量y
  y: number
}

/**
 * 表示速度的向量
 */
export type SpeedVector = Vector

/**
 * 物体坐标
 */
export type Location2d = {
  // 横坐标
  x: number
  // 纵坐标
  y: number
}

/**
 * 2d变换量
 */
export type Delta2d = Delta2dTranslate & Delta2dScale

/**
 * 就是常见的ID
 */
export type ID = string | number
/**
 * 就是常见的ID
 */
export type SessionID = ID
/**
 * 就是常见的url
 */
export type URL = string

/**
 * 2个方向
 */
export type Direction = 'x' | 'y'

/**
 * 3个方向
 */
export type Direction3D = 'x' | 'y' | 'z'

export type ReactProps<P = {}> = PropsWithChildren<P>
