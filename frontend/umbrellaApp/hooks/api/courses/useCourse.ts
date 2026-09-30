import { useState, useEffect, useMemo } from 'react';
import { useUmbrellaApi } from '../core/useUmbrellaApi';
import type { Course, CourseCategory, CourseModule } from '@/types/courses';
import { ALL_CATEGORY_ID } from '@/constants/mock/courses';

export function useCourses() {
    const { get } = useUmbrellaApi();
    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<CourseCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY_ID);
    const [query, setQuery] = useState('');

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

                const subjectsArray = Array.isArray(subjectsResponse) ? subjectsResponse : [];
                const dynamicCategories: CourseCategory[] = [
                    { id: ALL_CATEGORY_ID, label: 'Todos' },
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
            const matchesCategory =
                selectedCategory === ALL_CATEGORY_ID || course.categoryId === selectedCategory;
            const matchesQuery =
                normalizedQuery.length === 0 ||
                course.title.toLowerCase().includes(normalizedQuery) ||
                course.description.toLowerCase().includes(normalizedQuery) ||
                course.eyebrow.toLowerCase().includes(normalizedQuery);

            return matchesCategory && matchesQuery;
        });
    }, [selectedCategory, query, courses]);

    // Função para buscar os detalhes completos e módulos de um curso específico pelo ID
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
                    // Como visto no seu Controller Spring Boot, temos rotas separadas para detalhes do curso e módulos
                    const [courseRes, modulesRes] = await Promise.all([
                        get(`public/courses/${id}`),
                        get(`public/courses/${id}/modules`)
                    ]);

                    setCourseDetails(courseRes);

                    // Mapeando os módulos vindos do backend para o formato do front (ModuleAccordion)
                    const modulesArray = Array.isArray(modulesRes) ? modulesRes : [];
                    const transformedModules = modulesArray.map((m: any, index: number) => ({
                        id: String(m.id),
                        number: String(index + 1), // Convertido para string para satisfazer o tipo
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

    return {
        courses: filteredCourses,
        categories,
        loading,
        error,
        selectedCategory,
        setSelectedCategory,
        query,
        setQuery,
        useCourseDetails,
    };
}