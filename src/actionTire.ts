/* eslint-disable @typescript-eslint/no-this-alias */
import { motion } from './motion'

class ActionTire {
  public children = Array<ActionTire>(128)
  public isEnd = false
  public handler?: ActionHandler
  public insert(s: string, handler: ActionHandler) {
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

for (const [key, value] of Object.entries(motion)) {
  if (typeof value === 'function') {
    actionTire.insert(key, motion)
  }
}
