import { useState, useEffect, useMemo } from 'react';
import { useUmbrellaApi } from '../core/useUmbrellaApi';
import type { Course, CourseCategory } from '@/types/courses';
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
                console.log('Fetching courses and subjects...');


                const [coursesResponse, subjectsResponse] = await Promise.all([
                    get('public/courses/list'),
                    get('public/courses/subjects').catch(() => [])
                ]);

                console.log('Fetched courses:', coursesResponse);
                console.log('Fetched subjects:', subjectsResponse);


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
                        id: String(s.id ?? s),
                        label: s.name ?? String(s),
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

    return {
        courses: filteredCourses,
        categories,
        loading,
        error,
        selectedCategory,
        setSelectedCategory,
        query,
        setQuery,
    };
}