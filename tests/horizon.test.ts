import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import config from '../src/config';
import { issues } from '../src/horizon';

const projectRoot = process.cwd();
let html = '';
let fixtureRoot: string | undefined;

beforeAll(() => {
  execFileSync(process.execPath, ['run', 'build'], { cwd: projectRoot, stdio: 'pipe' });
  html = readFileSync(join(projectRoot, 'dist/horizon/index.html'), 'utf8');
}, 30_000);

afterAll(() => {
  if (fixtureRoot) rmSync(fixtureRoot, { recursive: true, force: true });
});

describe('计往开来独立栏目', () => {
  test('输出完整期刊、唯一主标题与分享元数据', () => {
    expect(html).toContain('<title>计往开来 · CXCS Horizon · CXCS</title>');
    expect(html).toMatch(/<meta name="description" content="[^"]+"/);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    for (const text of ['计往开来', 'CXCS Horizon', '2026 年 第 1 期', '创刊号']) {
      expect(html).toContain(text);
    }
    expect(html).toContain('/generated/page-covers/horizon.webp');
    expect(existsSync(join(projectRoot, 'dist/generated/page-covers/horizon.webp'))).toBe(true);
  });

  test('首屏优先加载响应式装饰图，只有一期时使用单卡网格', () => {
    expect(html).toContain('class="horizon-hero');
    const image = html.match(/<img\b[^>]*class="hero-bg"[^>]*>/)?.[0] ?? '';
    expect(image).toContain('fetchpriority="high"');
    expect(image).not.toContain('loading="lazy"');
    expect(image).toContain('width="2560" height="1440"');
    expect(image).toContain('alt=""');
    expect(image).toContain('960w');
    expect(image).toContain('1600w');
    expect(image).toContain('2560w');
    expect(html).toContain('class="issue-grid is-single"');
    expect(html.match(/class="issue-card"/g)).toHaveLength(1);
  });

  test('阅读、整卡与下载均指向实际 PDF，卡片不含嵌套链接', () => {
    const pdf = issues[0].pdf.href;
    expect(existsSync(join(projectRoot, 'dist', pdf))).toBe(true);
    const card = html.match(/<a class="issue-card"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';
    expect(card.match(/<a\b/g)).toHaveLength(1);
    expect(card).toContain(`href="${pdf}" target="_blank" rel="noopener noreferrer"`);
    expect(card).toContain('loading="lazy"');
    expect(html).toMatch(new RegExp(`class="hero-button hero-download" href="${pdf}" download`));
    expect(html).toContain(`下载 PDF · ${issues[0].pdf.sizeLabel}`);
    const sizeMB = Math.round(statSync(join(projectRoot, 'public', pdf)).size / 1_000_000);
    expect(issues[0].pdf.sizeLabel).toBe(`${sizeMB} MB`);
  });

  test('全站导航、移动菜单、页脚与 sitemap 发现栏目，RSS 保持文章订阅', () => {
    const home = readFileSync(join(projectRoot, 'dist/index.html'), 'utf8');
    const navigation = home.match(/<nav class="desktop-nav"[\s\S]*?<\/nav>/)?.[0] ?? '';
    expect(navigation).toMatch(/href="\/articles"[\s\S]*href="\/horizon"/);
    expect(home).toMatch(/href="\/horizon"[^>]*>\s*计往开来/);
    expect(home.match(/<footer\b[\s\S]*?<\/footer>/)?.[0]).toContain('href="/horizon"');
    const sitemap = readFileSync(join(projectRoot, 'dist/sitemap.xml'), 'utf8');
    expect(sitemap).toContain(`<loc>${config.site.url}/horizon</loc>`);
    const rss = readFileSync(join(projectRoot, 'dist/rss.xml'), 'utf8');
    expect(rss).not.toContain('/magazines/');
  });

  test('素材尺寸与体积符合首屏和封面预算', async () => {
    for (const [file, width, height, budget] of [
      ['hero-2026-01.webp', 2560, 1440, 450_000],
      ['hero-2026-01-1600.webp', 1600, 900, 450_000],
      ['hero-2026-01-960.webp', 960, 540, 450_000],
      ['cover-2026-01.webp', 720, 960, 120_000],
    ] as const) {
      const path = join(projectRoot, 'public/assets/horizon', file);
      const image = await sharp(path).metadata();
      expect([image.width, image.height, image.format]).toEqual([width, height, 'webp']);
      expect(statSync(path).size).toBeLessThanOrEqual(budget);
    }
  });

  test('期刊为空或全部为草稿时仍能构建，且不输出未发布期刊的链接与封面', () => {
    fixtureRoot = mkdtempSync(join(tmpdir(), 'cxcs-horizon-'));
    for (const file of ['src', 'package.json', 'astro.config.mjs', 'tsconfig.json']) {
      cpSync(join(projectRoot, file), join(fixtureRoot, file), { recursive: true });
    }
    symlinkSync(join(projectRoot, 'node_modules'), join(fixtureRoot, 'node_modules'), 'dir');
    symlinkSync(join(projectRoot, 'public'), join(fixtureRoot, 'public'), 'dir');
    const configPath = join(fixtureRoot, 'astro.config.mjs');
    writeFileSync(
      configPath,
      readFileSync(configPath, 'utf8').replace(
        'integrations: [mdx()],',
        'integrations: [mdx()],\nvite: { resolve: { preserveSymlinks: true } },',
      ),
    );
    const dataPath = join(fixtureRoot, 'src/horizon.ts');
    const originalData = readFileSync(dataPath, 'utf8');
    const cases = [
      "import type { HorizonIssue } from './types/horizon';\nexport const issues: HorizonIssue[] = [];\n",
      originalData.replace("id: 'horizon-2026-01',", "id: 'horizon-2026-01', draft: true,"),
    ];
    for (const data of cases) {
      writeFileSync(dataPath, data);
      execFileSync(process.execPath, ['run', 'build'], { cwd: fixtureRoot, stdio: 'pipe' });
      const empty = readFileSync(join(fixtureRoot, 'dist/horizon/index.html'), 'utf8');
      expect(empty).toContain('第一期正在制作中。');
      expect(empty.match(/<h1\b/g)).toHaveLength(1);
      expect(empty).not.toContain('class="issue-card"');
      expect(empty).not.toContain('class="hero-bg"');
      expect(empty).not.toContain('/magazines/horizon-2026-01.pdf');
    }
  }, 60_000);
});
