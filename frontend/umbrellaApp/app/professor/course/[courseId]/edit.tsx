import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';

import { CourseForm } from '@/components/professor/course-form';
import { LoadError } from '@/components/professor/load-error';
import { ScreenContainer } from '@/components/layout/screen-container';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import { useProfessorCourses } from '@/hooks/api/professor/useProfessorCourses';
import { useFocusData } from '@/hooks/use-focus-data';

const READ_ONLY_NOTICE =
  'Estes são os dados atuais do curso. O servidor ainda não permite alterá-los, por isso não é possível salvar edições por aqui.';

async function loadCourseForm(
  courseId: string,
  getCourseBasics: ReturnType<typeof useProfessorCourses>['getCourseBasics'],
  getCategories: ReturnType<typeof useProfessorCourses>['getCategories'],
) {
  const [course, categories] = await Promise.all([getCourseBasics(courseId), getCategories()]);
  return { course, categories };
}

export default function EditCourseScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { getCourseBasics, getCategories } = useProfessorCourses();
  const { data, loading, error, retry } = useFocusData(() =>
    loadCourseForm(courseId, getCourseBasics, getCategories),
  );

  if (loading) {
    return (
      <ScreenContainer disableTopInset contentContainerStyle={styles.content}>
        <UmbrellaText variant="body" color={Colors.light.textSecondary}>
          Carregando curso...
        </UmbrellaText>
      </ScreenContainer>
    );
  }

  if (error && !data) {
    return (
      <ScreenContainer disableTopInset contentContainerStyle={styles.content}>
        <LoadError message="Não foi possível carregar o curso." onRetry={retry} />
      </ScreenContainer>
    );
  }

  if (!data?.course) {
    return (
      <ScreenContainer disableTopInset contentContainerStyle={styles.content}>
        <UmbrellaText variant="title">Curso não encontrado</UmbrellaText>
      </ScreenContainer>
    );
  }

  const { course, categories } = data;

  return (
    <ScreenContainer disableTopInset contentContainerStyle={styles.content}>
      <CourseForm
        key={course.id}
        categories={categories}
        initialValues={{ title: course.title, description: course.description, categoryId: course.categoryId }}
        readOnlyNotice={READ_ONLY_NOTICE}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.lg,
  },
});
