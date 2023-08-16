import path from 'path'
import fs from 'fs/promises'

export async function getExeInDir(dir: string, filename: string) {
  const reExe = new RegExp(`^${filename}(?:$|\\.(?:exe|cmd|bat|ps1)$)`)
  for (const dirent of await fs.readdir(dir, { withFileTypes: true })) {
    if (reExe.test(dirent.name)) {
      return path.join(dirent.path, dirent.name)
    }
  }
  throw Error('Not Found at ' + dir)
}

export async function getExeFromEnv(name: string) {
  const pathDirs = process.env.PATH!.split(path.delimiter)
  for (const dir of pathDirs) {
    try {
      return await getExeInDir(dir, name)
    } catch {
      /* empty */
    }
  }
  throw Error(`Cannot find executables ${name} at process.env`)
}

export function execEval(cmd: string, args: string[]) {
  return ''
}
