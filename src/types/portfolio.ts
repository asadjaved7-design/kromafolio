export type DisciplineCategory =
  | 'UI/UX Design'
  | 'Brand Identity'
  | '3D & Motion'
  | 'Illustration'
  | 'Product Design'
  | 'Full-Stack Dev'
  | 'Photography'
  | 'Video & Film';

export const DISCIPLINE_CATEGORIES: DisciplineCategory[] = [
  'UI/UX Design',
  'Brand Identity',
  '3D & Motion',
  'Illustration',
  'Product Design',
  'Full-Stack Dev',
  'Photography',
  'Video & Film',
];

export type SlideLayout =
  | 'cover'
  | 'editorial-split'
  | 'metrics-impact'
  | 'palette-type'
  | 'process-steps'
  | 'full-showcase'
  | 'closing-credits';

export interface SlideMetric {
  label: string;
  value: string;
}

export interface PortfolioSlide {
  id: string;
  layout: SlideLayout;
  eyebrow: string;
  title: string;
  subtitle: string;
  body: string;
  backgroundStyle: 'light' | 'dark' | 'accent';
  imageUrl: string;
  bullets: string[];
  metrics: SlideMetric[];
  paletteColors: string[];
}

export interface PortfolioDeck {
  id: string;
  ownerId: string;
  creatorName: string;
  creatorHandle: string;
  creatorLocation: string;
  title: string;
  subtitle: string;
  category: DisciplineCategory;
  skills: string[];
  accentColor: string;
  coverImage: string;
  behanceUrl: string;
  dribbbleUrl: string;
  isPublished: boolean;
  allowFreePdf: boolean;
  appreciationCount: number;
  slides: PortfolioSlide[];
  createdAt?: unknown;
  updatedAt?: unknown;
  isCuratedDemo?: boolean;
}

export interface CreatorProfile {
  uid: string;
  displayName: string;
  handle: string;
  discipline: DisciplineCategory;
  location: string;
  bio: string;
  skills: string[];
  avatarColor: string;
  behanceUrl: string;
  dribbbleUrl: string;
  websiteUrl: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type AppTab = 'discover' | 'studio' | 'ai' | 'profile';
export type LegalModalKind = 'about' | 'privacy' | 'terms' | 'contact' | 'adsense' | null;
