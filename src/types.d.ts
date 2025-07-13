const __DEV__: boolean

interface Object {
  __proto__?: Object | null
}

type PromiseOr<T> = T | Promise<T>
