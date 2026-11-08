/** 在固定样式宿主中渲染各个 Example 并生成缩略图。 */
import { page, userEvent } from 'vitest/browser'
import { type Component, render } from '@/foundation'
import { afterAll, afterEach, beforeAll, test } from 'vitest'
import '../../../css/all-base.css'
import '../pages/ExampleDashboard.style'
import { exampleEntries } from '../pages/ExampleDashboard'
import './ExampleThumbnailCapture.style'
import { cssRoot } from '@/style-system'
import {
  KitContextRoot,
  type KitContextNode,
} from '@/components/kits/kitContext'

let dispose: (() => void) | undefined
const style = document.createElement('style')
style.id = 'css-root'
beforeAll(() => {
  document.head.append(style)
  cssRoot.mount()
})
afterAll(() => {
  style.remove()
})

const waitForLayout = () =>
  new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  )

async function captureThumbnail(
  name: string,
  Content: Component,
  prepare?: () => Promise<void>,
) {
  await page.viewport(960, 540)
  const host = document.body.appendChild(document.createElement('div'))
  dispose = render(() => {
    const rootNode: KitContextNode = { isRoot: true }
    return (
      <KitContextRoot value={rootNode}>
        <div class="example-thumbnail-capture-stage">
          <Content />
        </div>
      </KitContextRoot>
    )
  }, host)
  await document.fonts.ready
  await waitForLayout()
  await prepare?.()
  await waitForLayout()
  await Promise.all(
    document
      .getAnimations()
      .map((animation) => animation.finished.catch(() => {})),
  )
  await page.screenshot({
    ...(name === 'component-marker' || name === 'component-marker-structure-view-trigger'
      ? {}
      : {
          element: document.querySelector('.example-thumbnail-capture-stage')!,
        }),
    path: `../thumbnails/${name}.webp`,
  })
}

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
})

for (const entry of exampleEntries) {
  test(`生成 ${entry.title} 缩略图`, () =>
    captureThumbnail(entry.id, entry.content, async () => {
      if (entry.id === 'popover') {
        await userEvent.click(
          document.querySelector<HTMLButtonElement>('.popover-row button')!,
        )
      }
      if (entry.id === 'label') {
        await userEvent.hover(
          document.querySelector<HTMLButtonElement>('.Label button')!,
        )
      }
      if (entry.id === 'help') {
        await userEvent.hover(
          document.querySelector<HTMLButtonElement>('.Help')!,
        )
      }
      if (
        entry.id === 'component-marker' ||
        entry.id === 'component-marker-structure-view-trigger'
      ) {
        await userEvent.click(
          document.querySelector<HTMLButtonElement>('.ComponentMarkerStructureViewTrigger')!,
        )
      }
    }))
}
