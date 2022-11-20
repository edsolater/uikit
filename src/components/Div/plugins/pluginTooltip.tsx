import { isString } from '@edsolater/fnkit'
import { Tooltip } from '../../Tooltip'
import { DivChildNode } from '../type'
import { createWrapperPlugin } from './createPlugin'

export type TooltipPluginOptions = {
  content: DivChildNode
}

export const tooltip = createWrapperPlugin(
  (...args: [TooltipPluginOptions] | [content: TooltipPluginOptions['content'], options?: TooltipPluginOptions]) => {
    const options = (isString(args[0]) ? { ...args[1], content: args[0] } : args[0]) as TooltipPluginOptions
    return (node) => <Tooltip renderButton={() => node} renderTooltipContent={options.content} />
  }
)
