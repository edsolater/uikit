/**
 * 通用浮层的外部目标与无锚点示例。
 *
 * 直接组合Surface与Controller，触发方式由调用方选择。
 *
 * 展示底层能力不要求按钮外壳或Tooltip语义。
 */
import { Flow } from '@/components/kits/Flow/Flow'
import { Text } from '@/components/kits/Text/Text'
import { Button } from '@/components/kits/Button/Button'
import { PopoverSurface } from './PopoverSurface'
import { createPopoverVisibilityController } from './createPopoverVisibilityController'
import { createState, val } from '@/foundation'

/**
 * 展示锚定外部目标与独立显示的同一个浮层实体。
 */
export function PopoverSurfaceExample() {
  const [anchored, anchoredBindings] = createPopoverVisibilityController()
  const [standalone, standaloneBindings] = createPopoverVisibilityController()
  const offset = createState(0)
  return (
    <Flow>
      <Text p>浮层接受外部目标，也可不提供锚点；调用方决定何时显示。</Text>
      <Flow direction="row">
        <Button
          style={{
            'anchor-name': `--${anchored.triggerId}`,
            'position': 'relative',
            'left': `${val(offset)}px`,
          }}
          domRef={anchoredBindings.triggerDomRef}
          htmlProps={{ popovertarget: anchored.popoverId }}
        >
          显示目标旁的内容
        </Button>
        <Button
          domRef={standaloneBindings.triggerDomRef}
          htmlProps={{ popovertarget: standalone.popoverId }}
        >
          显示无锚点浮层
        </Button>
      </Flow>
      <PopoverSurface
        id={anchored.popoverId}
        anchor={`--${anchored.triggerId}`}
        popover="auto"
        domRef={anchoredBindings.popoverDomRef}
      >
        这里直接锚定外部按钮，没有另造触发器。
        <Button
          on={{
            click: () => {
              offset.set(val(offset) === 0 ? -60 : 0)
            },
          }}
        >
          沿边移动目标
        </Button>
      </PopoverSurface>
      <PopoverSurface
        id={standalone.popoverId}
        popover="auto"
        domRef={standaloneBindings.popoverDomRef}
      >
        这个浮层没有外部锚点，点击外部即可关闭。
      </PopoverSurface>
    </Flow>
  )
}
