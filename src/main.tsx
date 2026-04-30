// 这个入口只负责把本地 demo 挂到 HTML 容器，不参与组件库导出。
import { render } from 'solid-js/web'
import './index.css'
import App from './App'

render(() => <App />, document.getElementById('root')!)
