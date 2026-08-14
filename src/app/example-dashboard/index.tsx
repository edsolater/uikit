/**
 * 这个文件只负责把 Example 浏览应用挂到 HTML 容器。
 * 它不参与组件库导出，也不定义任何对外 API。
 * 组件库发布入口始终是 src/index.ts。
 */
import { render } from 'solid-js/web'
import App from './pages/ExampleDashboard'

render(() => <App />, document.getElementById('root')!)
