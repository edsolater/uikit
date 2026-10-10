/**
 * UIKit 源码路径映射。
 *
 * 为构建、测试和 Storybook 统一定义源码根目录别名，不携带构建插件或发布配置。
 *
 * 让不同运行入口对同一个源码引用使用相同的解析规则。
 */
import { fileURLToPath } from 'node:url'

/** 源码根目录的绝对路径映射，不依赖启动命令所在目录。 */
export const sourceAlias = {
  '@': fileURLToPath(new URL('./src', import.meta.url)),
}
