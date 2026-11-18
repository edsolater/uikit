/**
 * Markdown 的真实浏览器行为验收。
 *
 * 验证递归 content、默认语义和动态输入，以及实体与原生 HTML 的文本边界。
 *
 * 从公开组件入口检查最终 DOM，避免仅验证词法节点映射。
 */
import { render } from '@solidjs/web'
import { flush } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { createState } from '@/foundation'
import {
  Markdown,
  Heading,
  type MarkdownRenderers,
  type MarkdownController,
} from '@/components'
import { cssRoot } from '@/style-system'
import '@/css/all-base.css'

let dispose: (() => void) | undefined
let style: HTMLStyleElement

beforeEach(() => {
  style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
})

afterEach(() => {
  dispose?.()
  dispose = undefined
  style.remove()
  document.body.replaceChildren()
})

describe('Markdown', () => {
  test('自有解析保留代码制表符、未知实体和未闭合文字，强调可递归嵌套', () => {
    const host = document.body.appendChild(document.createElement('main'))
    const source = [
      '*外层 **内层** 外层* 和 **加粗 *强调***',
      '',
      '&constructor; &toString; &unknown; &#x110000; **未闭合尾文',
      '',
      '`a\tb &amp; **正文**`',
      '',
      '```ts',
      '\tconst value = "&amp; **正文**"',
      '```',
    ].join('\n')
    dispose = render(() => <Markdown>{source}</Markdown>, host)
    expect(host.querySelector('p > em > strong')?.textContent).toBe('内层')
    expect(host.querySelector('p > strong > em')?.textContent).toBe('强调')
    expect(host.textContent).toContain(
      '&constructor; &toString; &unknown; &#x110000; **未闭合尾文',
    )
    expect(host.querySelector('p > code')?.textContent).toBe(
      'a\tb &amp; **正文**',
    )
    expect(host.querySelector('pre > code')?.textContent).toBe(
      '\tconst value = "&amp; **正文**"',
    )
  })

  test('自有解析区分列表段落边界和表格内容中的竖线，链接括号不截断目标', () => {
    const host = document.body.appendChild(document.createElement('main'))
    const source = [
      '- 第一段',
      '',
      '  第二段',
      '  - 嵌套项',
      '- 第二项',
      '',
      '列表之外',
      '',
      '| 转义 | 代码 |',
      '| --- | --- |',
      '| a\\|b | `c|d` |',
      '',
      '[带 `]` 的链接](https://example.com/a_(b) "提示)标题")',
    ].join('\n')
    dispose = render(() => <Markdown>{source}</Markdown>, host)
    expect(
      host.querySelectorAll('.Markdown > ul > li:first-child > p'),
    ).toHaveLength(2)
    expect(host.querySelector('ul > li > ul > li')?.textContent).toBe('嵌套项')
    expect(host.querySelector('.Markdown > p')?.textContent).toBe('列表之外')
    const cells = host.querySelectorAll('tbody td')
    expect(cells).toHaveLength(2)
    expect(cells[0].textContent).toBe('a|b')
    expect(cells[1].querySelector('code')?.textContent).toBe('c|d')
    const link = host.querySelector('a')!
    expect(link.textContent).toBe('带 ] 的链接')
    expect(link.getAttribute('href')).toBe('https://example.com/a_(b)')
    expect(link.title).toBe('提示)标题')
  })

  test('默认呈现保留标题、嵌套列表、任务和表格的原生关系', () => {
    const host = document.body.appendChild(document.createElement('main'))
    dispose = render(
      () => (
        <Markdown>{`# 一级
## 二级
### 三级
#### 四级
##### 五级
###### 六级

段落 **加粗** *强调* ~~删除~~。

3. 第一项
   - 子列表
4. 第二项

- [x] 完成
- [ ] 待办

| 名称 | 数量 |
| :--- | ---: |
| **标题** | 2 |

> 引用

---

换行  
继续`}</Markdown>
      ),
      host,
    )
    expect(host.querySelectorAll('h1,h2,h3,h4,h5,h6')).toHaveLength(6)
    expect(host.querySelectorAll('.Heading')).toHaveLength(4)
    expect(host.querySelector('ol')?.start).toBe(3)
    expect(host.querySelector('ol > li > ul > li')?.textContent).toBe('子列表')
    expect(host.querySelector('ol > li > p')).toBeNull()
    const checks = host.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]',
    )
    expect([...checks].map(input => [input.checked, input.disabled])).toEqual([
      [true, true],
      [false, true],
    ])
    expect(host.querySelector('table > thead > tr > th')?.textContent).toBe(
      '名称',
    )
    expect(
      host.querySelector('table > tbody > tr > td > strong')?.textContent,
    ).toBe('标题')
    expect(
      getComputedStyle(host.querySelector('th:last-child')!).textAlign,
    ).toBe('right')
    expect(
      parseFloat(
        getComputedStyle(host.querySelector('ul')!).paddingInlineStart,
      ),
    ).toBeGreaterThan(0)
    expect(
      host.querySelectorAll('blockquote,hr,br,em,del,strong').length,
    ).toBeGreaterThanOrEqual(7)
  })

  test('父渲染器接收递归后的 content，省略保留默认而空返回隐藏', () => {
    const host = document.body.appendChild(document.createElement('main'))
    dispose = render(
      () => (
        <Markdown
          renderers={{
            h2: ({ content }) => <Heading level={3}>自定义：{content}</Heading>,
            strong: ({ content }) => (
              <span data-custom="strong">强调：{content}</span>
            ),
            blockquote: () => null,
            thematicBreak: () => false,
            inlineCode: () => undefined,
          }}
        >
          {'## 认识 **UIKit**\n\n普通段落\n\n> 隐藏引用\n\n---\n\n`隐藏代码`'}
        </Markdown>
      ),
      host,
    )
    expect(host.querySelector('h3')?.textContent).toBe(
      '自定义：认识 强调：UIKit',
    )
    expect(host.querySelector('h3 > span[data-custom]')?.textContent).toBe(
      '强调：UIKit',
    )
    expect(host.querySelector('p')?.textContent).toBe('普通段落')
    expect(host.textContent).not.toContain('隐藏')
    expect(host.querySelector('blockquote,hr,code')).toBeNull()
  })

  test('原文和配置更新到达显示，旧内容清理且 Controller 保持同一实例', () => {
    const host = document.body.appendChild(document.createElement('main'))
    const source = createState('## 初始 **内容**')
    const renderers = createState<MarkdownRenderers | undefined>()
    let controller!: MarkdownController
    let receives = 0,
      cleanups = 0
    dispose = render(
      () => (
        <Markdown
          ref={value => {
            controller = value
            receives++
          }}
          renderers={renderers}
        >
          {source}
        </Markdown>
      ),
      host,
    )
    expect(host.querySelector('h2')?.textContent).toBe('初始 内容')
    renderers.set({
      h2: ({ content }) => (
        <Heading
          level={3}
          domRef={() => () => {
            cleanups++
          }}
        >
          {content}
        </Heading>
      ),
    })
    flush()
    expect(host.querySelector('h2')).toBeNull()
    expect(host.querySelector('h3')?.textContent).toBe('初始 内容')
    source.set('## 最新 **内容**')
    flush()
    expect(host.querySelector('h3')?.textContent).toBe('最新 内容')
    expect(cleanups).toBe(1)
    controller.props.renderers.set({
      strong: ({ content }) => <em>{content}</em>,
    })
    flush()
    expect(host.querySelector('h2 > em')?.textContent).toBe('内容')
    expect(cleanups).toBe(2)
    controller.props.children.set('仅余文字')
    flush()
    expect(host.textContent).toBe('仅余文字')
    expect(receives).toBe(1)
  })

  test('实体只解码一次，代码与 HTML 保留原文，地址不执行脚本', () => {
    const host = document.body.appendChild(document.createElement('main'))
    dispose = render(
      () => (
        <Markdown>{`&amp; &#x4e2d; &#38;amp; \\&amp;

\`&amp; <b>\`

\`\`\`html
&amp; <b>
\`\`\`

<script>window.markdownExecuted = true</script>

[安全](https://example.com/?a=1&amp;b=2 "标题&amp;说明") [危险](javascript&#58;alert(1))

![图 **片** &amp;](https://example.com/image.png "提示&amp;内容")

[引用][ref]

[ref]: /target "目标"
`}</Markdown>
      ),
      host,
    )
    expect(host.querySelector('p')?.textContent).toBe('& 中 &amp; &amp;')
    expect(host.querySelector('p > code')?.textContent).toBe('&amp; <b>')
    expect(host.querySelector('pre > code')?.textContent).toBe('&amp; <b>')
    expect(host.querySelector('script')).toBeNull()
    expect(host.textContent).toContain(
      '<script>window.markdownExecuted = true</script>',
    )
    const links = host.querySelectorAll('a')
    expect(links).toHaveLength(2)
    expect(links[0].getAttribute('href')).toBe('https://example.com/?a=1&b=2')
    expect(links[0].title).toBe('标题&说明')
    expect(links[1].getAttribute('href')).toBe('/target')
    const image = host.querySelector('img')!
    expect(image.alt).toBe('图 片 &')
    expect(image.title).toBe('提示&内容')
  })
})
