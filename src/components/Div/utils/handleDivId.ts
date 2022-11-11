import { DivProps, HTMLTagMap } from '../type'

const refCache = new Map<string, unknown>()

export function handleDivId<TagName extends keyof HTMLTagMap = 'div'>(divProps: DivProps<TagName>): DivProps<TagName> {
  const id = divProps.refId
  if (id) {
    refCache.set(id, {
      /* todo */
    })
  }

  return divProps
}
