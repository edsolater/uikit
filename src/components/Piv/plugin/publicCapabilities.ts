/** 公共能力只选择配置并注入插件声明，执行与清理由插件消费链负责。 */
import { type Source, val } from '@/foundation'
import { derive } from '@/hooks/stateUtils'
import {
  draggable,
  type DraggableOptions,
} from '../../plugins/kits/draggable/draggable'
import {
  droppable,
  type DroppableOptions,
} from '../../plugins/kits/droppable/droppable'
import type { PivTag } from '../domMap'
import type { ShadowProps } from './handlePivPlugin'
import type { PivPlugin } from './runPlugin'

/** 同一能力选择快捷属性或显式 plugin 一种入口；false 只释放快捷路径的实例。 */
export interface PublicCapabilityProps {
  /** 快捷拖动入口；false 释放快捷实例，options.disabled 沿原插件契约创建后禁用。 */
  draggable?: Source<boolean | DraggableOptions | undefined>
  /** 快捷接收入口；同一能力在快捷属性和 plugin 两种方式中选择一种。 */
  droppable?: Source<boolean | DroppableOptions | undefined>
}

type Capability = keyof PublicCapabilityProps

export function getPublicPluginSources<Tag extends PivTag>(
  declarations: ShadowProps<Tag>[],
) {
  return (['draggable', 'droppable'] as const).flatMap(
    (key) => createPluginSource(declarations, key) ?? [],
  )
}

function createPluginSource<Tag extends PivTag>(
  declarations: ShadowProps<Tag>[],
  key: Capability,
): Source<PivPlugin<Tag> | undefined> | undefined {
  const sources = declarations.filter((props) => key in props)
  if (!sources.length) return
  const selection = derive(sources, (declarations) => {
    for (const props of declarations) {
      const selection = val(props[key])
      if (selection !== undefined) return selection
    }
  })
  return selection.map((options) =>
    !options
      ? undefined
      : key === 'draggable'
        ? draggable(
            options === true ? undefined : (options as DraggableOptions),
          )
        : droppable(
            options === true ? undefined : (options as DroppableOptions),
          ),
  )
}
