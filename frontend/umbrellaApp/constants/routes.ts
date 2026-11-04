import type { Href } from 'expo-router';

export const loginHref: Href = '/login';

export const studentHomeHref = '/(tabs)' as unknown as Href;

export const professorRoutes = {
  home: '/professor' as Href,
  newCourse: '/professor/new-course' as Href,
  settings: '/professor/settings' as Href,

  course: (courseId: string): Href => `/professor/course/${encodeURIComponent(courseId)}` as Href,
  editCourse: (courseId: string): Href => ({
    pathname: '/professor/course/[courseId]/edit',
    params: { courseId },
  }),
  modules: (courseId: string): Href => ({
    pathname: '/professor/course/[courseId]/modules',
    params: { courseId },
  }),
  newModule: (courseId: string): Href => ({
    pathname: '/professor/course/[courseId]/new-module',
    params: { courseId },
  }),
  editModule: (courseId: string, moduleId: string): Href => ({
    pathname: '/professor/course/[courseId]/new-module',
    params: { courseId, moduleId },
  }),
  materials: (courseId: string): Href => ({
    pathname: '/professor/course/[courseId]/materials',
    params: { courseId },
  }),
  newMaterial: (courseId: string): Href => ({
    pathname: '/professor/course/[courseId]/new-material',
    params: { courseId },
  }),
  activities: (courseId: string): Href => ({
    pathname: '/professor/course/[courseId]/activities',
    params: { courseId },
  }),
  newActivity: (courseId: string): Href => ({
    pathname: '/professor/course/[courseId]/new-activity',
    params: { courseId },
  }),
  editActivity: (courseId: string, activityId: string): Href => ({
    pathname: '/professor/course/[courseId]/new-activity',
    params: { courseId, activityId },
  }),
  students: (courseId: string): Href => ({
    pathname: '/professor/course/[courseId]/students',
    params: { courseId },
  }),
  live: (courseId: string): Href => ({
    pathname: '/professor/course/[courseId]/live',
    params: { courseId },
  }),
};

const TEACHER_ROLES = ['ROLE_TEACHER', 'ROLE_ADMIN'];

export function isTeacher(roles: string[] | undefined | null): boolean {
  return !!roles && roles.some((role) => TEACHER_ROLES.includes(role));
}

export function homeHrefForRoles(roles: string[] | undefined | null): Href {
  return isTeacher(roles) ? professorRoutes.home : studentHomeHref;
}
