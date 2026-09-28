import type { IconSymbolName } from '@/components/ui/icon-symbol';

export type CourseCategory = {
  id: string;
  label: string;
};

export type CourseFooter =
  | { type: 'rating'; durationLabel: string; rating: number }
  | { type: 'price'; priceLabel: string; free?: boolean };

export type Course = {
  id: string;
  categoryId: string;
  eyebrow: string;
  title: string;
  description: string;
  imageBadge: string;
  imageTone: string;
  showTrendingIcon?: boolean;
  footer: CourseFooter;
};

export type CourseResource = {
  id: string;
  icon: IconSymbolName;
  title: string;
  subtitle: string;
};

export type CourseLesson = {
  id: string;
  type: 'video' | 'doc';
  title: string;
  meta: string;
};

export type CourseModule = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  lessons: CourseLesson[];
};

export type CourseDetails = {
  heroBadge: string;
  instructorLabel: string;
  instructorName: string;
  duration: string;
  level: string;
  certification: string;
  ctaLabel: string;
  ctaCaption: string;
  overviewText: string;
  overviewResources: CourseResource[];
  contentSubtitle: string;
  modules: CourseModule[];
};