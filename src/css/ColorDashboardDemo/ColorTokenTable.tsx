/**
 * 这个文件只负责 ColorDashboard 的颜色列表展示。
 * 它负责扫描当前页面的颜色 token，并在环境颜色变化时重新读取结果。
 */
import { For, createEffect, onCleanup } from 'solid-js'
import { $, createDomRef, createState } from '../../hooks'

type ResolvedTokenState = {
  rawValue: string
  resolvedColor: string
}

/**
 * 判断当前规则是否还能继续向下读取子规则。
 */
function hasNestedCssRules(rule: CSSRule): rule is CSSRule & { cssRules: CSSRuleList } {
  return 'cssRules' in rule
}

/**
 * 递归扫描样式规则，找出 :root 上声明的 --color-* token。
 */
function collectColorTokenNamesFromRules(cssRules: CSSRuleList, tokens: Set<string>) {
  for (const rule of Array.from(cssRules)) {
    if (rule instanceof CSSStyleRule && rule.selectorText === ':root') {
      for (const name of Array.from(rule.style)) {
        if (name.startsWith('--color-')) {
          tokens.add(name)
        }
      }
      continue
    }

    if (hasNestedCssRules(rule)) {
      collectColorTokenNamesFromRules(rule.cssRules, tokens)
    }
  }
}

/**
 * 从当前页面已加载的 stylesheet 中直接提取 color token 列表。
 */
function readColorTokenNames() {
  const tokens = new Set<string>()

  for (const styleSheet of Array.from(document.styleSheets)) {
    try {
      collectColorTokenNamesFromRules(styleSheet.cssRules, tokens)
    } catch {
      continue
    }
  }

  return Array.from(tokens).sort((left, right) => left.localeCompare(right))
}

/**
 * 读取 token 在根节点上的源码字符串，便于同时看到语义来源。
 */
function readTokenRawValue(token: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim() || '未定义'
}

/**
 * 使用隐藏探针把 token 解析成浏览器最终可计算的颜色值。
 */
function readResolvedColor(token: string, probe: HTMLDivElement) {
  probe.style.backgroundColor = `var(${token})`
  return getComputedStyle(probe).backgroundColor || 'transparent'
}

/**
 * 汇总当前模式下所有 token 的源码和值，供列表统一展示。
 */
function collectResolvedTokens(tokens: string[], probe: HTMLDivElement) {
  return Object.fromEntries(
    tokens.map((token) => [
      token,
      {
        rawValue: readTokenRawValue(token),
        resolvedColor: readResolvedColor(token, probe),
      },
    ]),
  ) as Record<string, ResolvedTokenState>
}

export function ColorTokenTable() {
  const [colorTokens, setColorTokens] = createState<string[]>([])
  const [resolvedTokens, setResolvedTokens] = createState<Record<string, ResolvedTokenState>>({})
  const [probeRef, setProbeRef] = createDomRef<HTMLDivElement>()

  const refreshTokens = () => {
    const probeElement = $(probeRef)

    if (!probeElement) {
      return
    }

    const tokens = readColorTokenNames()
    setColorTokens(tokens)
    setResolvedTokens(collectResolvedTokens(tokens, probeElement))
  }

  createEffect(() => {
    if (!$(probeRef)) {
      return
    }

    refreshTokens()
  })

  createEffect(() => {
    if (!$(probeRef)) {
      return
    }

    const observer = new MutationObserver(() => {
      refreshTokens()
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleMediaChange = () => {
      refreshTokens()
    }

    mediaQuery.addEventListener('change', handleMediaChange)

    onCleanup(() => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', handleMediaChange)
    })
  })

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>name</th>
            <th>source</th>
            <th>value</th>
          </tr>
        </thead>
        <tbody>
          <For each={$(colorTokens)}>
            {(cssVariableName) => (
              <tr>
                <td>
                  <code>{cssVariableName}</code>
                </td>
                <td>{$((resolvedTokens))[cssVariableName]?.rawValue ?? '未读取'}</td>
                <td>{$((resolvedTokens))[cssVariableName]?.resolvedColor ?? '未解析'}</td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
      <div aria-hidden="true" ref={setProbeRef} />
    </>
  )
}