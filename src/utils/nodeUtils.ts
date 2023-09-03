import { exec, execFile } from 'child_process'
import util from 'util'

export const execFilePm = util.promisify(execFile)

export const execPm = util.promisify(exec)
