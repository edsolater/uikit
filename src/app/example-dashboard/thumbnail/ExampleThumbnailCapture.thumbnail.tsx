import { page, userEvent } from 'vitest/browser'
import type { Component } from 'solid-js'
import { render } from 'solid-js/web'
import { afterEach, test } from 'vitest'
import '../../../css/all-base.css'
import '../pages/ExampleDashboard.css'
import { ButtonExample } from '../../../components/kits/Button/Button.example'
import { CardExample } from '../../../components/kits/Card/Card.example'
import { InputExample } from '../../../components/kits/Input/Input.example'
import { PopoverExample } from '../../../components/kits/Popover/Popover.example'
import { DraggableExample } from '../../../components/plugins/kits/draggable/draggable.example'
import { DroppableExample } from '../../../components/plugins/kits/droppable/droppable.example'
import { ScopeExample } from '../../../components/plugins/kits/scope/scope.example'
import { PivStructureExample } from '../../../components/Piv/PivStructure.example'
import { ColorDashboardExample } from '../../../css/ColorDashboardExample'
import { UseDocumentTitleExample } from '../../../hooks/useDocumentTitle/useDocumentTitle.example'
import './ExampleThumbnailCapture.css'

let dispose: (() => void) | undefined

const waitForLayout = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))

async function captureThumbnail(name: string, Content: Component, prepare?: () => Promise<void>) {
  await page.viewport(960, 540)
  const host = document.body.appendChild(document.createElement('div'))
  dispose = render(() => <div class="example-thumbnail-capture-stage"><Content /></div>, host)
  await document.fonts.ready
  await waitForLayout()
  await prepare?.()
  await waitForLayout()
  await page.screenshot({
    element: document.querySelector('.example-thumbnail-capture-stage')!,
    path: `../thumbnails/${name}.webp`,
  })
}

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
})

test('生成 Card 缩略图', () => captureThumbnail('card', CardExample))
test('生成 Button 缩略图', () => captureThumbnail('button', ButtonExample))
test('生成 Input 缩略图', () => captureThumbnail('input', InputExample))
test('生成 Popover 缩略图', () => captureThumbnail('popover', PopoverExample, async () => {
  await userEvent.click(document.querySelector<HTMLButtonElement>('.popover-row button')!)
}))
test('生成 Draggable 缩略图', () => captureThumbnail('draggable', DraggableExample))
test('生成 Droppable 缩略图', () => captureThumbnail('droppable', DroppableExample))
test('生成 Scope 缩略图', () => captureThumbnail('scope', ScopeExample))
test('生成 Piv Structure 缩略图', () => captureThumbnail('piv-structure', PivStructureExample))
test('生成 Color 缩略图', () => captureThumbnail('color', ColorDashboardExample))
test('生成 useDocumentTitle 缩略图', () => captureThumbnail('use-document-title', UseDocumentTitleExample))