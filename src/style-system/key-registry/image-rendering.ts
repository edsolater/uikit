/**
 * 图像呈现的属性目标。
 *
 * 控制图像方向和像素重采样；不决定替换内容在盒内怎样适配。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $imageOrientation = key('image-orientation')

export const $imageRendering = key('image-rendering')

/** 图像呈现的 CSS 原名与具名 Key 对应表。 */
export const imageRenderingKeys = {
  'image-orientation': $imageOrientation,
  'image-rendering': $imageRendering,
}
