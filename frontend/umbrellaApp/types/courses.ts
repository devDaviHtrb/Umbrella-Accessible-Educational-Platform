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
  imageUrl?: string;
  showTrendingIcon?: boolean;
  footer: CourseFooter;
};

export type CourseModule = {
  id: string;
  number: string;
  title: string;
};
