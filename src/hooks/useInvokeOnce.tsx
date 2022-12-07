import { AnyFn } from '@edsolater/fnkit';
import { useRef } from 'react';

export function useInvokeOnce<T extends () => any>(fn: T, params?: []): ReturnType<T>;
export function useInvokeOnce<T extends AnyFn>(fn: T, params: Parameters<T>): ReturnType<T>;
export function useInvokeOnce<T extends AnyFn>(fn: T, params?: Parameters<T>): ReturnType<T> {
  const returnValue = useRef<ReturnType<T>>();
  if (!returnValue.current) {
    returnValue.current = fn.apply(undefined, params ?? []);
  }
  return returnValue.current!;
}
