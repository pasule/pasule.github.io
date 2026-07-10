// 生成默认 OG 图：把 logo SVG 转成 1200x630 PNG
import sharp from "sharp";
import { readFileSync } from "node:fs";

const svg = readFileSync("src/assets/logo.svg");

// OG 标准尺寸 1200x630，居中放 logo
await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 4,
    background: { r: 26, g: 15, b: 26, alpha: 1 }, // 深紫黑背景
  },
})
  .composite([
    {
      input: await sharp(svg).resize(560, 560).toBuffer(),
      gravity: "center",
    },
  ])
  .png()
  .toFile("public/og-default.png");

console.log("✓ 生成 public/og-default.png (1200x630)");
