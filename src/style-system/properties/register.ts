/** 公共入口使用实际 Key 定义安装完整名称集合。 */
import { registerCSSKey, type Key } from '../core/css-key'
import * as border from './border'
import * as boxShadow from './box-shadow'
import * as color from './color'
import * as font from './font'
import * as interaction from './interaction'
import * as layout from './layout'
import * as margin from './margin'
import * as opacity from './opacity'
import * as outline from './outline'
import * as padding from './padding'
import * as size from './size'
import * as transform from './transform'
import * as transition from './transition'

const propertyKeys: Key[] = [
  ...Object.values(border),
  ...Object.values(boxShadow),
  ...Object.values(color),
  ...Object.values(font),
  ...Object.values(interaction),
  ...Object.values(layout),
  ...Object.values(margin),
  ...Object.values(opacity),
  ...Object.values(outline),
  ...Object.values(padding),
  ...Object.values(size),
  ...Object.values(transform),
  ...Object.values(transition),
]

/** 安装全部现役属性名称；显式数据依赖保证打包后仍保留注册责任。 */
export function registerPropertyKeys(): void {
  for (const target of propertyKeys) registerCSSKey(target)
}
