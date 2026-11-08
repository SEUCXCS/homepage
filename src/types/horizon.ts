export interface HorizonIssue {
  id: string;
  title: string;
  period: string;
  badge?: string;
  publishedAt: Date;
  summary: string;
  cover: { src: string; alt: string };
  hero: { src: string; srcset?: string; alt: string };
  pdf: { href: string; sizeLabel: string };
  draft?: boolean;
}
