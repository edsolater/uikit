import { isString } from '@edsolater/fnkit'
import { createNormalPlugin } from './createPlugin'

export type TooltipPluginOptions = {
  content: string
}
/** used in user's use action */
export const tooltip = createNormalPlugin(
  (...args: [TooltipPluginOptions] | [content: TooltipPluginOptions['content'], options?: TooltipPluginOptions]) => {
    const options = (isString(args[0]) ? { ...args[1], content: args[0] } : args[0]) as TooltipPluginOptions

    return {
      htmlProps: {
        title: String(options.content)
      }
    }
  }
)
