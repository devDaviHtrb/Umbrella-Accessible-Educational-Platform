import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';

import { AppHeader } from '@/components/layout/app-header';
import { ScreenContainer } from '@/components/layout/screen-container';
import { SectionHeader } from '@/components/layout/section-header';
import { CourseCard } from '@/components/courses/course-card';
import { ShortcutRow } from '@/components/courses/shortcut-row';
import { CategoryChip } from '@/components/ui/category-chip';
import { SearchInput } from '@/components/ui/search-input';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
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
    isEnrolled,
    refetchCourses,
  } = useCourses();
  const firstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refetchCourses();
    }, [refetchCourses])
  );

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
        <UmbrellaText variant="body" color={Colors.light.error} style={{ marginTop: Spacing.lg }}>
          {error}
        </UmbrellaText>
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

      <ShortcutRow
        href="/courses/recorded"
        icon="rectangle.stack.fill"
        title="Aulas Gravadas"
        subtitle="Reveja o conteúdo das suas aulas quando quiser"
      />

      <ShortcutRow
        href="/courses/messages"
        icon="bubble.left.and.bubble.right"
        title="Mensagens"
        subtitle="Converse com instrutores e com a turma dos seus cursos"
      />

      <View style={styles.courseList}>
        {filteredCourses.length === 0 && !loading ? (
          <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            Nenhum curso encontrado para essa busca.
          </UmbrellaText>
        ) : (
          filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} isEnrolled={isEnrolled(course.id)} />
          ))
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
  courseList: {
    gap: Spacing.lg,
  },
});