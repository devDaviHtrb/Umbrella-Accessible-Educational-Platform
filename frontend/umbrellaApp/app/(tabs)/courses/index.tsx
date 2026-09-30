import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, ActivityIndicator, Text } from 'react-native';

import { AppHeader } from '@/components/layout/app-header';
import { ScreenContainer } from '@/components/layout/screen-container';
import { SectionHeader } from '@/components/layout/section-header';
import { CourseCard } from '@/components/courses/course-card';
import { Card } from '@/components/ui/card';
import { CategoryChip } from '@/components/ui/category-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SearchInput } from '@/components/ui/search-input';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useCourses } from '@/hooks/api/courses/useCourse';

export default function CoursesScreen() {
  const {
    courses: filteredCourses,
    categories,
    loading,
    error,
    selectedCategory,
    setSelectedCategory,
    query,
    setQuery,
  } = useCourses();

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

      {loading && (
        <ActivityIndicator size="large" color={Colors.light.primary} style={{ marginTop: Spacing.lg }} />
      )}

      {error && (
        <Text style={{ color: Colors.light.error, marginTop: Spacing.lg }}>{error}</Text>
      )}

      <View style={styles.section}>
        <SectionHeader title="Categorias" actionLabel="Ver todas" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}>
          {categories.map((category) => (
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
        {filteredCourses.length === 0 && !loading ? (
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