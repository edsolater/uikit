import { isString } from '@edsolater/fnkit'
import { createNormalPlugin } from './createPlugin'

export type HTMLTitlePluginOptions = {
  content: string
}
/** used in user's use action */
export const htmlTitle = createNormalPlugin(
  (
    ...args: [HTMLTitlePluginOptions] | [content: HTMLTitlePluginOptions['content'], options?: HTMLTitlePluginOptions]
  ) => {
    const options = (isString(args[0]) ? { ...args[1], content: args[0] } : args[0]) as HTMLTitlePluginOptions

    return {
      htmlProps: {
        title: String(options.content)
      }
    }
  }
)
