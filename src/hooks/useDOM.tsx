import { useState } from 'react'

export function useDOM<T extends HTMLElement = HTMLElement>(): [
  T | undefined,
  React.Dispatch<React.SetStateAction<HTMLElement | undefined>>
] {
  const [domObject, setDomObject] = useState<T>()
  //@ts-expect-error should check in specific use case not in type check
  return [domObject, setDomObject]
}
