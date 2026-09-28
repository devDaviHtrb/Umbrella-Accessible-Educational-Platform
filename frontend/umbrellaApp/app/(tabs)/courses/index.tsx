import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/layout/app-header';
import { ScreenContainer } from '@/components/layout/screen-container';
import { SectionHeader } from '@/components/layout/section-header';
import { CourseCard } from '@/components/courses/course-card';
import { Card } from '@/components/ui/card';
import { CategoryChip } from '@/components/ui/category-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SearchInput } from '@/components/ui/search-input';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { ALL_CATEGORY_ID, mockCourseCategories, mockCourses } from '@/constants/mock/courses';
import { Colors, Radius, Spacing } from '@/constants/theme';

export default function CoursesScreen() {
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY_ID);
  const [query, setQuery] = useState('');

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return mockCourses.filter((course) => {
      const matchesCategory =
        selectedCategory === ALL_CATEGORY_ID || course.categoryId === selectedCategory;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        course.title.toLowerCase().includes(normalizedQuery) ||
        course.description.toLowerCase().includes(normalizedQuery) ||
        course.eyebrow.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, query]);

  return (
    <ScreenContainer header={<AppHeader />}>
      <View>
        <UmbrellaText variant="display">
          Descubra seu próximo{'\n'}
          <UmbrellaText variant="display" color={Colors.light.primary}>
            conhecimento.
          </UmbrellaText>
        </UmbrellaText>
      </View>

      <SearchInput
        placeholder="O que você deseja aprender hoje?"
        value={query}
        onChangeText={setQuery}
      />

      <View style={styles.section}>
        <SectionHeader title="Categorias" actionLabel="Ver todas" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}>
          {mockCourseCategories.map((category) => (
            <CategoryChip
              key={category.id}
              label={category.label}
              selected={selectedCategory === category.id}
              onPress={() => setSelectedCategory(category.id)}
            />
          ))}
        </ScrollView>
      </View>

      <Link href="/courses/recorded" asChild>
        <Pressable accessibilityRole="button">
          <Card style={styles.recordedRow}>
            <View style={styles.recordedIcon}>
              <IconSymbol name="rectangle.stack.fill" size={18} color={Colors.light.primary} />
            </View>
            <View style={styles.recordedText}>
              <UmbrellaText variant="bodyMedium">Aulas Gravadas</UmbrellaText>
              <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
                Reveja o conteúdo das suas aulas quando quiser
              </UmbrellaText>
            </View>
            <IconSymbol name="chevron.right" size={18} color={Colors.light.textSecondary} />
          </Card>
        </Pressable>
      </Link>

      <View style={styles.courseList}>
        {filteredCourses.length === 0 ? (
          <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            Nenhum curso encontrado para essa busca.
          </UmbrellaText>
        ) : (
          filteredCourses.map((course) => <CourseCard key={course.id} course={course} />)
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.lg,
  },
  chipRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  recordedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  recordedIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordedText: {
    flex: 1,
  },
  courseList: {
    gap: Spacing.lg,
  },
});