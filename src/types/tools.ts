export type GetComponentProps<T extends (...args: any[]) => any> = Parameters<T>[0]
