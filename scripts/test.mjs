import { exec } from 'child_process'
import { promisify } from 'util'
const execPm = promisify(exec)
const text = '@set city=布达拉宫\n@echo %city%'
const handle = await execPm(
  text,
  // .split('\n')
  // .filter((t) => !/^(?:\s+|)$/.test(t))
  // .join(' && '),
  { shell: 'cmd' },
)
console.log(handle)
