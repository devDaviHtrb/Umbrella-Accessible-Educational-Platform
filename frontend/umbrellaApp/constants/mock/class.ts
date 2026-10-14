import type { ClassChatMessage, ClassResource } from '@/types/class';

export const mockClassEyebrow = 'Lorem Ipsum • Dolor Sit';
export const mockClassTitle = 'Lorem ipsum dolor sit amet consectetur adipiscing elit';
export const mockClassProgress = 0.35;

export const mockClassResources: ClassResource[] = [
  {
    id: 'doc-01',
    name: 'Lorem_Ipsum_Doc_01.pdf',
    meta: '2.1 MB • PDF',
    icon: 'doc.fill',
  },
  {
    id: 'presentation-01',
    name: 'Lorem_Ipsum_Presentation.pptx',
    meta: '5.4 MB • Slides',
    icon: 'doc.richtext.fill',
  },
];

export const mockPublicChatMessages: ClassChatMessage[] = [
  {
    id: 'public-1',
    senderName: 'Lorem Ipsum',
    isSelf: false,
    time: '00:00',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  },
  {
    id: 'public-2',
    senderName: 'Você',
    isSelf: true,
    time: '00:05',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  },
  {
    id: 'public-3',
    senderName: 'Lorem Ipsum',
    isSelf: false,
    time: '00:10',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  },
];

export const mockProfessorChatMessages: ClassChatMessage[] = [
  {
    id: 'professor-1',
    senderName: 'Prof. Ricardo',
    isSelf: false,
    time: '00:02',
    text: 'Fico à disposição por aqui se tiver dúvidas durante a aula.',
  },
];