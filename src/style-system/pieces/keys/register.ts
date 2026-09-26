/** 按现成 JSSKey 定义集中安装名称集合。 */
import { registerJSSKey, type JSSKeyDefinition } from '../../key'
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

const materialKeys: JSSKeyDefinition[] = [
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

/** 安装现役 JSSKey 名称；显式数据依赖保证打包后仍保留注册责任。 */
export function registerMaterialKeys(): void {
  for (const target of materialKeys) registerJSSKey(target)
}
