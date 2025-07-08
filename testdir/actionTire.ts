/* eslint-disable @typescript-eslint/no-this-alias */

class ActionTire {
  public children = Array<ActionTire>(128)
  public isEnd = false
  public handler?: unknown
  public insert(s: string, handler: unknown) {
    let node: ActionTire = this
    for (let i = 0; i < s.length; i++) {
      node = node.children[s.charCodeAt(i)] ??= new ActionTire()
    }
    node.isEnd = true
    node.handler = handler
  }
  public has(s: string) {
    let node: ActionTire = this
    for (let i = 0; i < s.length; i++) {
      node = node.children[s.charCodeAt(i)]
      if (!node) {
        return false
      }
    }
    return node.isEnd
  }
  public startsWith(s: string) {
    let node: ActionTire = this
    for (let i = 0; i < s.length; i++) {
      node = node.children[s.charCodeAt(i)]
      if (!node) {
        return false
      }
    }
    return true
  }
}

export const actionTire = new ActionTire()
