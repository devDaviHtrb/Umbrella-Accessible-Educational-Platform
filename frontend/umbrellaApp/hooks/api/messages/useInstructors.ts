import { useEffect, useState } from 'react';

import { useUmbrellaApi } from '@/hooks/api/core/useUmbrellaApi';
import { useChat } from '@/hooks/messages/chatContext';

export type Instructor = {
  id: string;
  name: string;
  courseTitle: string;
};

type CourseWithInstructor = {
  title?: string;
  name?: string;
  userDto?: { id: number; name: string } | null;
};

export function useInstructors(courseIds: string[]) {
  const { get } = useUmbrellaApi();
  const { userId, registerPeer } = useChat();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const idsKey = courseIds.join(',');

  useEffect(() => {
    let active = true;

    Promise.all(
      courseIds.map((courseId) =>
        get<CourseWithInstructor>(`public/courses/${courseId}`).catch(() => null),
      ),
    ).then((courses) => {
      if (!active) return;
      const found = new Map<string, Instructor>();
      courses.forEach((course) => {
        const instructor = course?.userDto;
        if (!instructor || instructor.id === userId || found.has(String(instructor.id))) return;
        found.set(String(instructor.id), {
          id: String(instructor.id),
          name: instructor.name,
          courseTitle: course?.title ?? course?.name ?? '',
        });
        registerPeer(String(instructor.id), instructor.name);
      });
      setInstructors(Array.from(found.values()));
    });

    return () => {
      active = false;
    };
  }, [idsKey, get, userId, registerPeer]);

  return instructors;
}
