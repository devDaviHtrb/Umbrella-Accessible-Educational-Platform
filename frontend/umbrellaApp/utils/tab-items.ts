import type { Href } from 'expo-router';

import type { BottomBarItem } from '@/components/layout/bottom-bar';
import type { IconSymbolName } from '@/components/ui/icon-symbol';
import { professorRoutes } from '@/constants/routes';

export const TAB_ICON: Record<string, IconSymbolName> = {
  index: 'square.grid.2x2.fill',
  courses: 'graduationcap.fill',
  tutor: 'brain.head.profile',
  agenda: 'calendar',
  settings: 'gearshape.fill',
};

export function buildTabItems(
  state: { index: number; routes: any[] },
  descriptors: Record<string, any> | undefined,
  createOnPress: (route: any) => () => void,
): BottomBarItem[] {
  return state.routes.map((route: any, index: number) => {
    const options = descriptors?.[route.key]?.options ?? {};
    const label =
      typeof options.tabBarLabel === 'string' ? options.tabBarLabel : (options.title ?? route.name ?? '');

    return {
      key: route.key,
      label: String(label),
      icon: TAB_ICON[route.name] ?? 'circle',
      focused: state.index === index,
      onPress: createOnPress(route),
    };
  });
}

export type ProfessorBarTab = 'home' | 'tutor' | 'settings';

export function getProfessorBarItems(
  active: ProfessorBarTab,
  navigate: (href: Href) => void,
): BottomBarItem[] {
  return [
    {
      key: 'home',
      label: 'Cursos',
      icon: TAB_ICON.courses,
      focused: active === 'home',
      onPress: () => {
        if (active !== 'home') navigate(professorRoutes.home);
      },
    },
    {
      key: 'tutor',
      label: 'Tutor IA',
      icon: TAB_ICON.tutor,
      focused: active === 'tutor',
      onPress: () => {
        if (active !== 'tutor') navigate(professorRoutes.tutor);
      },
    },
    {
      key: 'settings',
      label: 'Ajustes',
      icon: TAB_ICON.settings,
      focused: active === 'settings',
      onPress: () => {
        if (active !== 'settings') navigate(professorRoutes.settings);
      },
    },
  ];
}
