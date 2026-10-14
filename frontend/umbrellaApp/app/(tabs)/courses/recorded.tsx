import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { LessonCard } from '@/components/recorded/lesson-card';
import { ScreenContainer } from '@/components/layout/screen-container';
import { CategoryChip } from '@/components/ui/category-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SearchInput } from '@/components/ui/search-input';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import {
  ALL_RECORDED_CATEGORY_ID,
  mockRecordedCategories,
  mockRecordedLessons,
} from '@/constants/mock/recorded-classes';

export default function RecordedClassesScreen() {
  const [selectedCategory, setSelectedCategory] = useState(ALL_RECORDED_CATEGORY_ID);
  const [query, setQuery] = useState('');

  const filteredLessons = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return mockRecordedLessons.filter((lesson) => {
      const matchesCategory =
        selectedCategory === ALL_RECORDED_CATEGORY_ID || lesson.categoryId === selectedCategory;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        lesson.title.toLowerCase().includes(normalizedQuery) ||
        lesson.description.toLowerCase().includes(normalizedQuery) ||
        lesson.category.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, query]);

  function handleLessonPress() {
  }

  return (
    <ScreenContainer disableTopInset>
      <View>
        <UmbrellaText variant="display">Aulas Gravadas</UmbrellaText>
        <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.subtitle}>
          Acesse o histórico completo de lições e revise o conteúdo quando desejar.
        </UmbrellaText>
      </View>

      <SearchInput
        placeholder="Buscar por título ou tema..."
        value={query}
        onChangeText={setQuery}
      />

      <View style={styles.toolbarRow}>
        <Pressable style={styles.toolbarButton} accessibilityRole="button">
          <IconSymbol name="line.3.horizontal.decrease" size={16} color={Colors.light.text} />
          <UmbrellaText variant="bodyMedium">Filtrar</UmbrellaText>
        </Pressable>
        <Pressable style={styles.toolbarButton} accessibilityRole="button">
          <IconSymbol name="arrow.up.arrow.down" size={16} color={Colors.light.text} />
          <UmbrellaText variant="bodyMedium">Ordenar</UmbrellaText>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}>
        {mockRecordedCategories.map((category) => (
          <CategoryChip
            key={category.id}
            label={category.label}
            selected={selectedCategory === category.id}
            onPress={() => setSelectedCategory(category.id)}
          />
        ))}
      </ScrollView>

      <View style={styles.lessonList}>
        {filteredLessons.length === 0 ? (
          <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            Nenhuma aula encontrada para essa busca.
          </UmbrellaText>
        ) : (
          filteredLessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} onPress={handleLessonPress} />
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