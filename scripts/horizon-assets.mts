// 用法：bun scripts/horizon-assets.mts /tmp/horizon-page1.png [2026-01]
// 先将 PDF 首页渲染为 3200px 宽 PNG；中间文件保留在 /tmp，不提交到仓库。
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const page = process.argv[2] ?? '/tmp/horizon-page1.png';
const issue = process.argv[3] ?? '2026-01';
if (!/^\d{4}-\d{2}$/.test(issue)) throw new Error('期刊编号应为 YYYY-NN。');

const output = 'public/assets/horizon';
const PAGE_W = 3200;
const CROP_TOP = 2400; // 首页高 4313px，避开封面标题和「本期看点」。
const CROP_H = 1800; // 16:9，保留四位角色、玻璃机房与台阶。
const metadata = await sharp(page).metadata();
if (metadata.width !== PAGE_W || (metadata.height ?? 0) < 4267) {
  throw new Error('请提供 3200px 宽、至少 4267px 高的 PDF 首页 PNG。');
}

await mkdir(output, { recursive: true });
const hero = () => sharp(page).extract({ left: 0, top: CROP_TOP, width: PAGE_W, height: CROP_H });

await hero().resize({ width: 2560 }).webp({ quality: 80, effort: 6 }).toFile(`${output}/hero-${issue}.webp`);
await hero().resize({ width: 1600 }).webp({ quality: 78, effort: 6 }).toFile(`${output}/hero-${issue}-1600.webp`);
await hero().resize({ width: 960 }).webp({ quality: 76, effort: 6 }).toFile(`${output}/hero-${issue}-960.webp`);

// 封面从页顶取 3:4，保留原生标题；输出严格的 720×960。
await sharp(page)
  .extract({ left: 0, top: 0, width: PAGE_W, height: 4267 })
  .resize({ width: 720, height: 960 })
  .webp({ quality: 82, effort: 6 })
  .toFile(`${output}/cover-${issue}.webp`);
