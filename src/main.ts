const relative = process.argv[2]
if (!relative || relative === 'out/main') {
  process.exit()
}
import(`./${relative.substring(4).replaceAll('\\', '/')}.js`)
