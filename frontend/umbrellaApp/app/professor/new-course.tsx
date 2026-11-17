import { router } from 'expo-router';
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

export default function NewCourseScreen() {
  const { getCategories, createCategory, createCourse, uploadCourseImage } = useProfessorCourses();
  const { data: categories, loading, error: loadError, reload, retry } = useFocusData(getCategories);

  async function handleCreateCategory(name: string) {
    const created = await createCategory(name);
    await reload();
    return created.id;
  }

  const { submit, submitting, error } = useSubmit(
    async (input: CourseFormSubmit) => {
      let imageUrl: string | undefined;
      let imagePublicId: string | undefined;
      if (input.pickedImage) {
        const uploaded = await uploadCourseImage(input.pickedImage);
        imageUrl = uploaded.url;
        imagePublicId = uploaded.publicId;
      }

      const createdId = await createCourse({
        title: input.title,
        description: input.description,
        categoryId: input.categoryId,
        imageUrl,
        imagePublicId,
      });
      if (createdId) {
        router.replace(professorRoutes.course(createdId));
      } else {
        router.dismissTo(professorRoutes.home);
      }
    },
    { errorMessage: 'Não foi possível criar o curso. Tente novamente.' },
  );

  return (
    <ScreenContainer disableTopInset contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <UmbrellaText variant="body" color={Colors.light.textSecondary}>
        Preencha os dados básicos. Depois de criar o curso você poderá adicionar módulos e atividades.
      </UmbrellaText>

      {loading ? (
        <UmbrellaText variant="body" color={Colors.light.textSecondary}>
          Carregando categorias...
        </UmbrellaText>
      ) : loadError && !categories ? (
        <LoadError message="Não foi possível carregar as categorias." onRetry={retry} />
      ) : categories ? (
        <CourseForm
          categories={categories}
          onCreateCategory={handleCreateCategory}
          submitLabel="Criar Curso"
          submitting={submitting}
          submitError={error}
          onSubmit={submit}
        />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.lg,
  },
});
