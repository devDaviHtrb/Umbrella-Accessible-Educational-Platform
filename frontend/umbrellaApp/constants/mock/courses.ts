import type { Course, CourseCategory, CourseDetails } from '@/types/courses';

export const ALL_CATEGORY_ID = 'todos';

export const mockCourseCategories: CourseCategory[] = [
  { id: ALL_CATEGORY_ID, label: 'Todos' },
  { id: 'tech', label: 'Tech' },
  { id: 'ciencia', label: 'Ciência' },
  { id: 'negocios', label: 'Negócios' },
  { id: 'design', label: 'Design' },
];

export const mockCourses: Course[] = [
  {
    id: 'lorem-ipsum-dolor-sit-amet',
    categoryId: 'tech',
    eyebrow: 'Lorem Ipsum',
    title: 'Lorem Ipsum Dolor Sit Amet Consectetur',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do…',
    imageBadge: 'LOREM IPSUM',
    imageTone: '#0B2A6B',
    showTrendingIcon: true,
    footer: { type: 'rating', durationLabel: '24h', rating: 4.9 },
  },
  {
    id: 'lorem-ipsum-sit-elit',
    categoryId: 'ciencia',
    eyebrow: 'Lorem Ipsum',
    title: 'Lorem Ipsum Sit Elit',
    description: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.',
    imageBadge: 'LOREM',
    imageTone: '#2B2F36',
    footer: { type: 'rating', durationLabel: '6h', rating: 5.0 },
  },
  {
    id: 'consectetur-adipiscing',
    categoryId: 'negocios',
    eyebrow: 'Lorem Ipsum',
    title: 'Consectetur Adipiscing',
    description: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    imageBadge: 'IPSUM',
    imageTone: '#12211A',
    footer: { type: 'rating', durationLabel: '20h', rating: 4.0 },
  },
  {
    id: 'ut-enim-ad-minim',
    categoryId: 'tech',
    eyebrow: 'Lorem Ipsum',
    title: 'Ut Enim Ad Minim Veniam',
    description: 'Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    imageBadge: 'LOREM',
    imageTone: '#153E90',
    footer: { type: 'rating', durationLabel: '12h', rating: 4.6 },
  },
  {
    id: 'duis-aute-irure',
    categoryId: 'design',
    eyebrow: 'Lorem Ipsum',
    title: 'Duis Aute Irure Dolor',
    description: 'In reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    imageBadge: 'IPSUM',
    imageTone: '#4C2E6B',
    footer: { type: 'rating', durationLabel: '10h', rating: 4.5 },
  },
  {
    id: 'excepteur-sint',
    categoryId: 'ciencia',
    eyebrow: 'Lorem Ipsum',
    title: 'Excepteur Sint Occaecat',
    description: 'Cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    imageBadge: 'LOREM',
    imageTone: '#0B4F4A',
    footer: { type: 'rating', durationLabel: '8h', rating: 4.8 },
  },
];

export const mockCourseDetails: CourseDetails = {
  heroBadge: 'Umbrella Premium',
  instructorLabel: 'Instrutor Umbrella',
  instructorName: 'Lorem Ipsum',
  duration: 'Lorem Ipsum',
  level: 'Lorem Ipsum',
  certification: 'Credenciada pela Umbrella',
  ctaLabel: 'Matricule-se Agora',
  ctaCaption: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  overviewText:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  overviewResources: [
    { id: 'material', icon: 'doc.fill', title: 'Lorem Ipsum', subtitle: 'Lorem ipsum dolor sit amet' },
    { id: 'video-intro', icon: 'play.circle.fill', title: 'Lorem Ipsum', subtitle: 'Lorem ipsum dolor sit amet' },
  ],
  contentSubtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing.',
  modules: [
    {
      id: 'modulo-01',
      number: '01',
      title: 'Lorem Ipsum',
      subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing.',
      lessons: [],
    },
    {
      id: 'modulo-02',
      number: '02',
      title: 'Lorem Ipsum',
      subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing.',
      lessons: [
        { id: 'aula-01', type: 'video', title: 'Lorem Ipsum', meta: '00:00' },
        { id: 'aula-02', type: 'doc', title: 'Lorem Ipsum', meta: 'PDF' },
      ],
    },
  ],
};