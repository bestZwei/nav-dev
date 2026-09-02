// 由 public/icons/waypoint.svg 生成扩展 manifest 所需的全套 PNG 尺寸
import sharp from "sharp"
import { mkdir } from "node:fs/promises"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const source = resolve(root, "public/icons/waypoint.svg")
const outDir = resolve(root, "public/icons")

await mkdir(outDir, { recursive: true })

const sizes = [16, 32, 48, 128, 512]
for (const size of sizes) {
  const out = resolve(outDir, `icon${size}.png`)
  await sharp(source, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(out)
  console.log(`generated ${out}`)
}
