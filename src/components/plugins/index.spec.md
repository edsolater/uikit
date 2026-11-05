# Plugins

Plugin 为 Piv 节点声明交互或结构能力。`tools` 提供定义与控制入口：`defineInactivePlugin` 定义单个节点算法，`defineInactivePlugins` 按名称组合多个算法；工厂接受配置后得到可直接交给 `is` 的 Plugin。拖放相关能力及示例归 `kits/dragAndDrop`。

```tsx
<Piv is={hoverable()} />
<Piv is={hoverable({ initialHovered: true })} />
const [plugin, controller] = usePlugin(hoverable)
<Piv is={plugin} />
```

`usePlugin` 返回当前节点的控制入口；节点未安装或已卸载时成员缺席。每个受控 Plugin 同时只安装一个节点，卸载后可重挂；不同节点使用各自的 Plugin。节点声明和清理由 Piv 的运行链接管。

当前能力包括 clickable、hoverable、topLayer、draggable、droppable、tooltip 和 tabularNum。`dragAndDrop` 组织拖动与接收工厂，同组使用共享的 `id` 对象。页面内拖放使用 Pointer Events，浏览器外部材料由 droppable 接收。tooltip 沿 Piv 结构工具挂载现有 PopoverSurface，沿用现有交互与定位。
