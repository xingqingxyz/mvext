import fs from 'fs'

await Promise.all(
  fs.globSync('dist/*.{js,cjs,map}').map((p) => fs.promises.rm(p)),
)
