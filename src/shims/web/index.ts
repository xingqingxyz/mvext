import process from 'process'
declare const self: typeof globalThis
// vscode web worker
self.process = process
export default {}
