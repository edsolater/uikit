/**
 * StructureViewFab 是App手动放入的组件定位框浮动开关。
 *
 * 初始关闭，点击后才显示覆盖层；卸载时释放本次查看。
 *
 * 按钮位于内容之外并保持清晰，随时能够关闭查看。
 */
import { createState, val, Show } from '@/foundation'
import { Button } from '@/components/kits/Button/Button'
import { StructureViewControl } from './ComponentWrapper'
import { StructureViewOverlay } from './StructureViewOverlay'
import './StructureView.style'

/**
 * 手动加载组件定位框开关，切换不重建原组件。
 */
export function StructureViewFab() {
  let control!: HTMLButtonElement
  const enabled = createState(false)
  const pressed = enabled.map(current => current ? 'true' as const : 'false' as const)
  return <StructureViewControl value={true}>
    <Button class="StructureViewFab" filled name="切换组件定位框"
      ref={element => { control = element }}
      htmlProps={{ 'aria-pressed': pressed }} onClick={() => { enabled.set(current => !current) }}>
      {val(enabled) ? '关闭组件定位框' : '打开组件定位框'}
    </Button>
    <Show when={val(enabled)}><StructureViewOverlay control={control} /></Show>
  </StructureViewControl>
}
