import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { LessonCard } from '@/components/recorded/lesson-card';
import { LoadError } from '@/components/professor/load-error';
import { ScreenContainer } from '@/components/layout/screen-container';
import { CategoryChip } from '@/components/ui/category-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SearchInput } from '@/components/ui/search-input';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useRecordedLessons } from '@/hooks/api/courses/useRecordedLessons';
import type { RecordedCategory } from '@/types/recorded-classes';

const ALL_CATEGORY_ID = 'todos';

export default function RecordedClassesScreen() {
  const { lessons, loading, error, reload } = useRecordedLessons();
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY_ID);
  const [query, setQuery] = useState('');
  const [sortByTitle, setSortByTitle] = useState(false);

  const categories = useMemo<RecordedCategory[]>(() => {
    const byId = new Map<string, string>();
    lessons.forEach((lesson) => byId.set(lesson.categoryId, lesson.category));
    return [
      { id: ALL_CATEGORY_ID, label: 'Todos' },
      ...Array.from(byId, ([id, label]) => ({ id, label })),
    ];
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const result = lessons.filter((lesson) => {
      const matchesCategory = selectedCategory === ALL_CATEGORY_ID || lesson.categoryId === selectedCategory;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        lesson.title.toLowerCase().includes(normalizedQuery) ||
        lesson.description.toLowerCase().includes(normalizedQuery) ||
        lesson.category.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });

    return sortByTitle ? [...result].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR')) : result;
  }, [lessons, selectedCategory, query, sortByTitle]);

  return (
    <ScreenContainer disableTopInset>
      <View>
        <UmbrellaText variant="display">Aulas Gravadas</UmbrellaText>
        <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.subtitle}>
          Revise os vídeos dos módulos dos cursos em que você está matriculado.
        </UmbrellaText>
      </View>

      <SearchInput placeholder="Buscar por título ou tema..." value={query} onChangeText={setQuery} />

      <View style={styles.toolbarRow}>
        <Pressable
          style={styles.toolbarButton}
          accessibilityRole="button"
          onPress={() => setSortByTitle((current) => !current)}>
          <IconSymbol name="arrow.up.arrow.down" size={16} color={Colors.light.text} />
          <UmbrellaText variant="bodyMedium">{sortByTitle ? 'Ordem: A–Z' : 'Ordem: padrão'}</UmbrellaText>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {categories.map((category) => (
          <CategoryChip
            key={category.id}
            label={category.label}
            selected={selectedCategory === category.id}
            onPress={() => setSelectedCategory(category.id)}
          />
        ))}
      </ScrollView>

      <View style={styles.lessonList}>
        {loading && lessons.length === 0 ? (
          <ActivityIndicator color={Colors.light.primary} />
        ) : error && lessons.length === 0 ? (
          <LoadError message={error} onRetry={reload} />
        ) : filteredLessons.length === 0 ? (
          <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            {lessons.length === 0
              ? 'Nenhum vídeo disponível nos seus cursos ainda.'
              : 'Nenhuma aula encontrada para essa busca.'}
          </UmbrellaText>
        ) : (
          filteredLessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onPress={() =>
                router.push({
                  pathname: '/courses/lesson',
                  params: {
                    title: lesson.title,
                    description: lesson.description,
                    url: lesson.url,
                    category: lesson.category,
                    moduleTitle: lesson.moduleTitle,
                    sizeLabel: lesson.sizeLabel,
                  },
                })
              }
            />
          ))
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginTop: Spacing.sm,
  },
  toolbarRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  chipRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  lessonList: {
    gap: Spacing.lg,
  },
});
