import { useState, useEffect, useMemo } from 'react';
import { useUmbrellaApi } from '../core/useUmbrellaApi';
import { useAuthContext } from '@/hooks/api/auth/authContext';
import type { Course, CourseCategory, CourseModule } from '@/types/courses';
import { ALL_CATEGORY_ID } from '@/constants/mock/courses';

export const ENROLLED_CATEGORY_ID = 'matriculados';

export interface GenericResponse {
    status: string;
    message: string;
    code: number;
}

export interface ExceptionResponse {
    status: string;
    message: string;
    code: number;
    timestamp: string; 
}

// Module-level global state and subscriber list for enrolled courses
let globalEnrolledCourses: Course[] = [];
let listeners: Array<() => void> = [];

const setGlobalEnrolledCourses = (newCourses: Course[] | ((prev: Course[]) => Course[])) => {
    if (typeof newCourses === 'function') {
        globalEnrolledCourses = newCourses(globalEnrolledCourses);
    } else {
        globalEnrolledCourses = newCourses;
    }
    listeners.forEach((listener) => listener());
};

export function useCourses() {
    const { post, get, del } = useUmbrellaApi();
    const { userId: authUserId } = useAuthContext();
    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<CourseCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY_ID);
    const [query, setQuery] = useState('');
    const [enrollmentedCourses, setLocalEnrolledCourses] = useState<Course[]>(globalEnrolledCourses);

    useEffect(() => {
        const listener = () => setLocalEnrolledCourses([...globalEnrolledCourses]);
        listeners.push(listener);
        return () => {
            listeners = listeners.filter((l) => l !== listener);
        };
    }, []);

    const fetchEnrolledCourses = async () => {
        try {
            const errolmentedCoursesResponse = await get('public/courses/errolment');
            const enrrolmentCoursesArray = Array.isArray(errolmentedCoursesResponse) ? errolmentedCoursesResponse : [];
            const transformedEnrollmentedCourses = enrrolmentCoursesArray.map((c: any): Course => ({
                id: String(c.id),
                categoryId: c.subjectId ? String(c.subjectId) : ALL_CATEGORY_ID,
                eyebrow: c.name ?? '',
                title: c.name ?? '',
                description: c.description ?? '',
                imageBadge: c.subjectName ?? '',
                imageTone: '#153E90',
                imageUrl: c.imageUrl,
                showTrendingIcon: false,
                footer: {
                    type: 'rating' as const,
                    durationLabel: '0h',
                    rating: 0
                },
            }));
            setGlobalEnrolledCourses(transformedEnrollmentedCourses);
        } catch (err) {
            console.log('[useCourses] Failed to fetch enrolled courses', err);
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const [coursesResponse, subjectsResponse] = await Promise.all([
                    get('public/courses/list'),
                    get('public/courses/subjects').catch(() => [])
                ]);

                const coursesArray = Array.isArray(coursesResponse) ? coursesResponse : [];
                const transformedCourses = coursesArray.map((c: any): Course => ({
                    id: String(c.id),
                    categoryId: c.subjectId ? String(c.subjectId) : ALL_CATEGORY_ID,
                    eyebrow: c.name ?? '',
                    title: c.name ?? '',
                    description: c.description ?? '',
                    imageBadge: c.subjectName ?? '',
                    imageTone: '#153E90',
                    imageUrl: c.imageUrl,
                    showTrendingIcon: false,
                    footer: {
                        type: 'rating' as const,
                        durationLabel: '0h',
                        rating: 0
                    },
                }));
                setCourses(transformedCourses);

                await fetchEnrolledCourses();

                const subjectsArray = Array.isArray(subjectsResponse) ? subjectsResponse : [];
                const dynamicCategories: CourseCategory[] = [
                    { id: ALL_CATEGORY_ID, label: 'Todos' },
                    { id: ENROLLED_CATEGORY_ID, label: 'Matriculados' },
                    ...subjectsArray.map((s: any) => ({
                        id: String(s.id),
                        label: s.name ?? '',
                    }))
                ];
                setCategories(dynamicCategories);
                setError(null);
            } catch (err: any) {
                console.error('Erro ao buscar dados de cursos:', err);
                setError('Failed to load courses');
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const filteredCourses = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return courses.filter((course) => {
            const isEnrolled = enrollmentedCourses.some((e) => String(e.id) === String(course.id));

            let matchesCategory = false;
            if (selectedCategory === ALL_CATEGORY_ID) {
                matchesCategory = true;
            } else if (selectedCategory === ENROLLED_CATEGORY_ID) {
                matchesCategory = isEnrolled;
            } else {
                matchesCategory = course.categoryId === selectedCategory;
            }

            const matchesQuery =
                normalizedQuery.length === 0 ||
                course.title.toLowerCase().includes(normalizedQuery) ||
                course.description.toLowerCase().includes(normalizedQuery) ||
                course.eyebrow.toLowerCase().includes(normalizedQuery) ||
                (isEnrolled && ('matriculado'.includes(normalizedQuery) || 'matriculados'.includes(normalizedQuery)));

            return matchesCategory && matchesQuery;
        });
    }, [selectedCategory, query, courses, enrollmentedCourses]);

    const isEnrolled = (courseId: string) => {
        return enrollmentedCourses.some((c) => String(c.id) === String(courseId));
    };

    const useCourseDetails = (id: string) => {
        const [courseDetails, setCourseDetails] = useState<any>(null);
        const [modules, setModules] = useState<CourseModule[]>([]);
        const [detailLoading, setDetailLoading] = useState(true);
        const [detailError, setDetailError] = useState<string | null>(null);

        useEffect(() => {
            if (!id) return;

            const fetchDetails = async () => {
                try {
                    setDetailLoading(true);
                    const [courseRes, modulesRes] = await Promise.all([
                        get(`public/courses/${id}`),
                        get(`public/courses/${id}/modules`)
                    ]);

                    setCourseDetails(courseRes);

                    const modulesArray = Array.isArray(modulesRes) ? modulesRes : [];
                    const transformedModules = modulesArray.map((m: any, index: number) => ({
                        id: String(m.id),
                        number: String(index + 1),
                        title: m.name ?? m.title ?? '',
                        subtitle: `${(m.lessons ?? []).length} aulas`,
                        lessons: (m.lessons ?? []).map((l: any) => ({
                            id: String(l.id),
                            title: l.title ?? '',
                            duration: l.duration ?? '10m',
                        }))
                    }));

                    setModules(transformedModules);
                } catch (err) {
                    console.error('Erro ao buscar detalhes do curso:', err);
                    setDetailError('Erro ao carregar detalhes do curso.');
                } finally {
                    setDetailLoading(false);
                }
            };

            fetchDetails();
        }, [id]);

        return { courseDetails, modules, detailLoading, detailError };
    };

    const createEnrollment = async (id: string, userId?: string): Promise<GenericResponse | ExceptionResponse> => {
        const targetUserId = userId || authUserId;
        if (!targetUserId) {
            return {
                status: "Bad Request",
                message: "Usuário não autenticado.",
                code: 400,
                timestamp: new Date().toISOString()
            };
        }
        try {
            const response = await post<GenericResponse>(`public/courses/${id}/enrrolment/${targetUserId}`);
            
            const courseToEnroll = courses.find((c) => String(c.id) === String(id));
            if (courseToEnroll) {
                setGlobalEnrolledCourses((prev) => {
                    if (prev.some((c) => String(c.id) === String(id))) return prev;
                    return [...prev, courseToEnroll];
                });
            } else {
                await fetchEnrolledCourses();
            }

            return response;
        } catch (error: any) {
            console.log("[useCourses enrollment error]", error.response?.data || error.message);
            
            if (error.response && error.response.data) {
                return error.response.data as ExceptionResponse;
            }
            
            return {
                status: "Internal Server Error",
                message: error.message || "Erro desconhecido ao realizar a matrícula.",
                code: 500,
                timestamp: new Date().toISOString()
            };
        }
    };

    const deleteEnrollment = async (id: string, userId?: string): Promise<GenericResponse | ExceptionResponse> => {
        const targetUserId = userId || authUserId;
        if (!targetUserId) {
            return {
                status: "Bad Request",
                message: "Usuário não autenticado.",
                code: 400,
                timestamp: new Date().toISOString()
            };
        }
        try {
            const response = await del<GenericResponse>(`public/courses/${id}/enrrolment/${targetUserId}`);
            
            setGlobalEnrolledCourses((prev) => prev.filter((c) => String(c.id) !== String(id)));

            return response;
        } catch (error: any) {
            console.log("[useCourses delete enrollment error]", error.response?.data || error.message);
            
            if (error.response && error.response.data) {
                return error.response.data as ExceptionResponse;
            }
            
            return {
                status: "Internal Server Error",
                message: error.message || "Erro desconhecido ao remover a matrícula.",
                code: 500,
                timestamp: new Date().toISOString()
            };
        }
    };

    return {
        courses: filteredCourses,
        allCourses: courses,
        enrollmentedCourses,
        categories,
        loading,
        error,
        selectedCategory,
        setSelectedCategory,
        query,
        setQuery,
        useCourseDetails,
        createEnrollment,
        deleteEnrollment,
        isEnrolled,
        refetchEnrolledCourses: fetchEnrolledCourses,
    };
}