/* eslint-disable @typescript-eslint/no-this-alias */

export const enum ActionHandlerKind {
  Invoke,
  Count,
  Terminator,
}

export interface ActionHandlerContext {
  command: string
  count?: number
  argStr?: string
  select?: boolean
}

export type ActionMeta = {
  handler: (context: ActionHandlerContext) => void
} & (
  | {
      kind: ActionHandlerKind.Invoke
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
  public add(s: string, meta: ActionMeta) {
    let node: ActionTire | undefined = this
    for (let i = 0; i < s.length; i++) {
      node = node.children[s.charCodeAt(i)] ??= new ActionTire()
    }
    node.meta = meta
  }
  public get(s: string) {
    let node: ActionTire | undefined = this
    for (let i = 0; i < s.length; i++) {
      node = node.children[s.charCodeAt(i)]
      if (!node) {
        return
      }
    }
    return node
  }
  public *keys(): Generator<ActionTire> {
    if (this.meta) {
      yield this
    }
    for (const child of this.children) {
      if (child === undefined) {
        continue
      }
      yield* child.keys()
    }
  }
  [Symbol.iterator] = this.keys
}

export const actionTire = new ActionTire()
