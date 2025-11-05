/* eslint-disable @typescript-eslint/no-this-alias */

export const enum ActionHandlerKind {
  Immediate,
  Count,
  Terminator,
}

export interface ActionHandlerContext {
  command: string
  count?: number
  argStr?: string
}

export type ActionMeta = {
  handler: (context: ActionHandlerContext) => PromiseOr<void>
} & (
  | {
      kind: ActionHandlerKind.Immediate
    }
  | {
      kind: ActionHandlerKind.Count
      count: number
    }
  | {
      kind: ActionHandlerKind.Terminator
      terminator: string
    }
)

class ActionTire {
  public children = Array<ActionTire | undefined>(128)
  public meta?: ActionMeta
  public add(this: ActionTire, s: string, meta: ActionMeta) {
    let node = this
    for (let i = 0; i < s.length; i++) {
      node = node.children[s.charCodeAt(i)] ??= new ActionTire()
    }
    node.meta = meta
  }
  public get(this: ActionTire, s: string) {
    let node = this
    for (let i = 0; i < s.length; i++) {
      node = node.children[s.charCodeAt(i)]!
      if (!node) {
        return
      }
    }
    return node
  }
  public *keys(s = ''): Generator<string> {
    if (this.meta) {
      yield s
      return
    }
    for (let i = 0; i < this.children.length; i++) {
      if (this.children[i] === undefined) {
        continue
      }
      yield* this.children[i]!.keys(s + String.fromCharCode(i))
    }
  }
  public *values(): Generator<ActionTire> {
    if (this.meta) {
      yield this
      return
    }
    for (const child of this.children) {
      if (child === undefined) {
        continue
      }
      yield* child.values()
    }
  }
  [Symbol.iterator] = this.keys
}

export const actionTire = new ActionTire()
