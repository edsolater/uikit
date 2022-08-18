import { flapDeep, isArray, isString, MayDeepArray, shakeNil, toKebabCase, uncapitalize } from '@edsolater/fnkit'

export type DivDataTag = {
  key: string
  value?: string
}

export function toDataset(...tags: MayDeepArray<DivDataTag | undefined>[]): Record<string, any> | undefined {
  if (tags.every((t) => t == null) || flapDeep(tags).every((t) => t == null)) return
  return shakeNil(
    Object.fromEntries(shakeNil(flapDeep([tags])).map((tag) => [`data-${toKebabCase(tag.key)}`, tag.value]))
  )
}

export function createDataTag(config: { key: string; value: boolean | number | string }): DivDataTag {
  return {
    key: uncapitalize(config.key),
    value: toString(config.value ?? true)
  }
}

function toString(v?: unknown | undefined): string | undefined {
  return v == null ? undefined : String(v)
}

export function hasTag(el: HTMLElement, tag: DivDataTag): boolean {
  return tag.value ? el.dataset[tag.key] === tag.value : Boolean(el.dataset[tag.key])
}
