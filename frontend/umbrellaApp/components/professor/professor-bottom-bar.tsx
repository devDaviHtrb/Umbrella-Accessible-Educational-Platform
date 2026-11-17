import { router } from 'expo-router';

import { BottomBar } from '@/components/layout/bottom-bar';
import { getProfessorBarItems, type ProfessorBarTab } from '@/utils/tab-items';

export function ProfessorBottomBar({ active }: { active: ProfessorBarTab }) {
  return <BottomBar items={getProfessorBarItems(active, (href) => router.replace(href))} />;
}
