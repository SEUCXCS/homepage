import type { HorizonIssue } from './types/horizon';

export const issues: HorizonIssue[] = [
  {
    id: 'horizon-2026-01',
    title: '计往开来 2026 第一期',
    period: '2026 年 第 1 期',
    badge: '创刊号',
    publishedAt: new Date('2026-11-08'),
    summary: '从权重空间到大语言模型，这一期把好奇心装订成册。',
    cover: {
      src: '/assets/horizon/cover-2026-01.webp',
      alt: '计往开来 2026 第一期封面：夕阳中的校园、玻璃机房和四位计协娘',
    },
    hero: {
      src: '/assets/horizon/hero-2026-01.webp',
      srcset:
        '/assets/horizon/hero-2026-01-960.webp 960w, /assets/horizon/hero-2026-01-1600.webp 1600w, /assets/horizon/hero-2026-01.webp 2560w',
      alt: '夕阳下，四位计协娘站在校园与玻璃机房前的台阶上',
    },
    pdf: {
      href: 'https://pan.mcf.ink/d/sharepoint-yuanzui/MyFile/Public/Magazines/CXCSHorizon/%E8%AE%A1%E5%BE%80%E5%BC%80%E6%9D%A5%202026%20%E7%AC%AC%E4%B8%80%E6%9C%9F.pdf?sign=SQ-kmdRetDCWks8uWpYZLZxEEGuMtof0O2eDQzfX1ZA=:0',
      sizeLabel: '50 MB',
    },
  },
];
