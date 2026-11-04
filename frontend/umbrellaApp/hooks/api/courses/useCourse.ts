import { useState, useEffect, useMemo, useCallback } from 'react';
import { useUmbrellaApi } from '../core/useUmbrellaApi';
import { useAuthContext } from '@/hooks/api/auth/authContext';
import type { Course, CourseCategory, CourseModule } from '@/types/courses';
import type { CourseDetailApiDto } from '@/types/professor-api';

export const ALL_CATEGORY_ID = 'todos';
export const ENROLLED_CATEGORY_ID = 'matriculados';

export interface GenericResponse {
    status: string;
    message: string;
    code: number;
}

export interface ExceptionResponse extends GenericResponse {
    timestamp: string;
}

let globalEnrolledCourses: Course[] = [];
let listeners: Array<() => void> = [];

const setGlobalEnrolledCourses = (newCourses: Course[] | ((prev: Course[]) => Course[])) => {
    globalEnrolledCourses = typeof newCourses === 'function' ? newCourses(globalEnrolledCourses) : newCourses;
    listeners.forEach((listener) => listener());
};

function mapCourse(c: any): Course {
    return {
        id: String(c.id),
        categoryId: c.subjectId ? String(c.subjectId) : ALL_CATEGORY_ID,
        eyebrow: c.name ?? '',
        title: c.name ?? '',
        description: c.description ?? '',
        imageBadge: c.subjectName ?? '',
        imageTone: '#153E90',
        imageUrl: c.imageUrl,
        showTrendingIcon: false,
        footer: { type: 'rating', durationLabel: '0h', rating: 0 },
    };
}

function enrollmentError(error: any, fallbackMessage: string): ExceptionResponse {
    if (error.response?.data) {
        return error.response.data as ExceptionResponse;
    }
    return {
        status: 'Internal Server Error',
        message: error.message || fallbackMessage,
        code: 500,
        timestamp: new Date().toISOString(),
    };
}

export function useCourseDetails(id: string) {
    const { get } = useUmbrellaApi();
    const [courseDetails, setCourseDetails] = useState<CourseDetailApiDto | null>(null);
    const [modules, setModules] = useState<CourseModule[]>([]);
    const [detailLoading, setDetailLoading] = useState(true);
    const [detailError, setDetailError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchDetails = async () => {
            try {
                setDetailLoading(true);
                const [courseRes, modulesRes] = await Promise.all([
                    get<CourseDetailApiDto>(`public/courses/${id}`),
                    get(`public/courses/${id}/modules`),
                ]);

                setCourseDetails(courseRes);

                const modulesArray: any[] = Array.isArray(modulesRes) ? modulesRes : [];
                setModules(
                    modulesArray.map((m, index): CourseModule => {
                        const lessons: any[] = m.lessons ?? [];
                        return {
                            id: String(m.id),
                            number: String(index + 1),
                            title: m.name ?? m.title ?? '',
                            subtitle: `${lessons.length} aulas`,
                            lessons: lessons.map((l) => ({
                                id: String(l.id),
                                type: 'video',
                                title: l.title ?? '',
                                meta: l.duration ?? '10m',
                            })),
                        };
                    }),
                );
                setDetailError(null);
            } catch (err) {
                console.error('Erro ao buscar detalhes do curso:', err);
                setDetailError('Erro ao carregar detalhes do curso.');
            } finally {
                setDetailLoading(false);
            }
        };

        fetchDetails();
    }, [id, get]);

    return { courseDetails, modules, detailLoading, detailError };
}

export function useCourses() {
    const { post, get, del } = useUmbrellaApi();
    const { userId: authUserId } = useAuthContext();
    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<CourseCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY_ID);
    const [query, setQuery] = useState('');
    const [enrolledCourses, setLocalEnrolledCourses] = useState<Course[]>(globalEnrolledCourses);

    useEffect(() => {
        const listener = () => setLocalEnrolledCourses([...globalEnrolledCourses]);
        listeners.push(listener);
        return () => {
            listeners = listeners.filter((l) => l !== listener);
        };
    }, []);

    const fetchEnrolledCourses = useCallback(async (): Promise<Course[]> => {
        try {
            const response = await get('public/courses/errolment');
            const enrolled = (Array.isArray(response) ? response : []).map(mapCourse);
            setGlobalEnrolledCourses(enrolled);
            return enrolled;
        } catch (err) {
            console.log('[useCourses] Failed to fetch enrolled courses', err);
            return globalEnrolledCourses;
        }
    }, [get]);

    const loadCourses = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const [coursesResponse, subjectsResponse] = await Promise.all([
                get('public/courses/list'),
                get('public/courses/subjects').catch(() => []),
            ]);

            setCourses((Array.isArray(coursesResponse) ? coursesResponse : []).map(mapCourse));

            const subjects: any[] = Array.isArray(subjectsResponse) ? subjectsResponse : [];
            setCategories([
                { id: ALL_CATEGORY_ID, label: 'Todos' },
                { id: ENROLLED_CATEGORY_ID, label: 'Matriculados' },
                ...subjects.map((s) => ({ id: String(s.id), label: s.name ?? '' })),
            ]);
            setError(null);
        } catch (err) {
            console.error('Erro ao buscar dados de cursos:', err);
            if (!silent) setError('Falha ao carregar os cursos.');
        } finally {
            if (!silent) setLoading(false);
        }
    }, [get]);

    useEffect(() => {
        loadCourses();
    }, [loadCourses]);

    const refetchCourses = useCallback(() => loadCourses(true), [loadCourses]);

    useEffect(() => {
        setGlobalEnrolledCourses([]);
        if (authUserId) {
            fetchEnrolledCourses();
        }
    }, [authUserId, fetchEnrolledCourses]);

    const isEnrolled = (courseId: string) => enrolledCourses.some((c) => c.id === String(courseId));

    const filteredCourses = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return courses.filter((course) => {
            const enrolled = enrolledCourses.some((e) => e.id === course.id);

            let matchesCategory = course.categoryId === selectedCategory;
            if (selectedCategory === ALL_CATEGORY_ID) {
                matchesCategory = true;
            } else if (selectedCategory === ENROLLED_CATEGORY_ID) {
                matchesCategory = enrolled;
            }

            const matchesQuery =
                normalizedQuery.length === 0 ||
                course.title.toLowerCase().includes(normalizedQuery) ||
                course.description.toLowerCase().includes(normalizedQuery) ||
                course.eyebrow.toLowerCase().includes(normalizedQuery) ||
                (enrolled && 'matriculados'.includes(normalizedQuery));

            return matchesCategory && matchesQuery;
        });
    }, [selectedCategory, query, courses, enrolledCourses]);

    const createEnrollment = async (id: string): Promise<GenericResponse | ExceptionResponse> => {
        try {
            const response = await post<GenericResponse>(`public/courses/${id}/enroll`);
            await fetchEnrolledCourses();
            return response;
        } catch (error: any) {
            console.log('[useCourses enrollment error]', error.response?.data || error.message);
            return enrollmentError(error, 'Erro desconhecido ao realizar a matrícula.');
        }
    };

    const deleteEnrollment = async (id: string): Promise<GenericResponse | ExceptionResponse> => {
        try {
            const response = await del<GenericResponse>(`public/courses/${id}/enroll`);
            setGlobalEnrolledCourses((prev) => prev.filter((c) => c.id !== String(id)));
            return response;
        } catch (error: any) {
            console.log('[useCourses delete enrollment error]', error.response?.data || error.message);
            return enrollmentError(error, 'Erro desconhecido ao remover a matrícula.');
        }
    };

    return {
        courses: filteredCourses,
        enrolledCourses,
        categories,
        loading,
        error,
        selectedCategory,
        setSelectedCategory,
        query,
        setQuery,
        createEnrollment,
        deleteEnrollment,
        isEnrolled,
        refetchEnrolledCourses: fetchEnrolledCourses,
        refetchCourses,
    };
}
