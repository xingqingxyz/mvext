import process from 'process'
import { Go } from './go'

declare const self: typeof globalThis & { Go: typeof Go }

// vscode web worker
self.process = process
self.Go = Go
