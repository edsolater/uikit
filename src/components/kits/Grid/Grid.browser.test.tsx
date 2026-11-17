/**
 * Grid 样式配置与窄屏布局的浏览器验证。
 *
 * 核对动态列模板与响应布局的组合，不让实例覆盖压过媒体规则。
 *
 * 列模板的来源与实际布局应在切换时持续保持一致。
 */
import { expect, test } from 'vitest'
import { page } from 'vitest/browser'
import { createState, render } from '@/foundation'
import { cssRoot } from '@/style-system'
import { Grid } from './Grid'

test('窄屏默认退列，固定布局持续读取模板，恢复响应布局后重新退列', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  const style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  const columns = createState(3)
  const responsive = createState<boolean | undefined>()
  const dispose = render(
    () => (
      <Grid $columns={columns} $responsive={responsive}>
        <span>甲</span>
        <span>乙</span>
        <span>丙</span>
        <span>丁</span>
      </Grid>
    ),
    host,
  )
  const grid = host.firstElementChild!
  /**
   * 读取浏览器最终解析的轨道数量，不依赖 Token 的输出名称。
   */
  const columnCount = () =>
    getComputedStyle(grid).gridTemplateColumns.split(' ').length
  try {
    await page.viewport(480, 768)
    await expect.poll(columnCount).toBe(1)
    columns.set(4)
    await expect.poll(columnCount).toBe(1)
    responsive.set(false)
    await expect.poll(columnCount).toBe(4)
    columns.set(2)
    await expect.poll(columnCount).toBe(2)
    responsive.set(true)
    await expect.poll(columnCount).toBe(1)
    await page.viewport(1024, 768)
    await expect.poll(columnCount).toBe(2)
  } finally {
    dispose()
    host.remove()
    style.remove()
    await page.viewport(1024, 768)
  }
})
