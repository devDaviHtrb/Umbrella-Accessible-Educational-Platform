import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';

import { CourseForm, type CourseFormSubmit } from '@/components/professor/course-form';
import { LoadError } from '@/components/professor/load-error';
import { ScreenContainer } from '@/components/layout/screen-container';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { professorRoutes } from '@/constants/routes';
import { Colors, Spacing } from '@/constants/theme';
import { useProfessorCourses } from '@/hooks/api/professor/useProfessorCourses';
import { useFocusData } from '@/hooks/use-focus-data';
import { useSubmit } from '@/hooks/use-submit';

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
  const { getCourseBasics, getCategories, updateCourse, uploadCourseImage } = useProfessorCourses();
  const { data, loading, error, retry } = useFocusData(() =>
    loadCourseForm(courseId, getCourseBasics, getCategories),
  );

  const { submit, submitting, error: submitError } = useSubmit(
    async (input: CourseFormSubmit) => {
      let imageUrl: string | undefined;
      let imagePublicId: string | undefined;
      if (input.pickedImage) {
        const uploaded = await uploadCourseImage(input.pickedImage);
        imageUrl = uploaded.url;
        imagePublicId = uploaded.publicId;
      }

      await updateCourse(courseId, {
        title: input.title,
        description: input.description,
        categoryId: input.categoryId,
        imageUrl,
        imagePublicId,
      });
      router.replace(professorRoutes.course(courseId));
    },
    { errorMessage: 'Não foi possível salvar as alterações. Tente novamente.' },
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
    <ScreenContainer disableTopInset contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <CourseForm
        key={course.id}
        categories={categories}
        initialValues={{ title: course.title, description: course.description, categoryId: course.categoryId }}
        initialImageUrl={course.imageUrl}
        submitLabel="Salvar Alterações"
        submitting={submitting}
        submitError={submitError}
        onSubmit={submit}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.lg,
  },
});
