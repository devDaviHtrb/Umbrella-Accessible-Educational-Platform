import { StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/layout/app-header';
import { ScreenContainer } from '@/components/layout/screen-container';
import { SectionHeader } from '@/components/layout/section-header';
import { AgendaTimeline } from '@/components/painel/agenda-timeline';
import { ModuleCard } from '@/components/painel/module-card';
import { WeeklyGoalsCard } from '@/components/painel/weekly-goals-card';
import { Card } from '@/components/ui/card';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import { mockActiveModules, mockTodayAgenda, mockUserName, mockWeeklyGoals } from '@/constants/mock/painel';

export default function PainelScreen() {
  return (
    <ScreenContainer header={<AppHeader />}>
      <View>
        <UmbrellaText variant="display">Bem-vindo de volta,{'\n'}{mockUserName}</UmbrellaText>
        <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.subtitle}>
          Seu santuário acadêmico está pronto para os insights de hoje.
        </UmbrellaText>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Módulos Ativos" actionLabel="Ver Currículo" />
        <View style={styles.moduleList}>
          {mockActiveModules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </View>
      </View>

      <WeeklyGoalsCard goals={mockWeeklyGoals} />

      <Card>
        <UmbrellaText variant="headline" style={styles.agendaTitle}>
          Agenda de Hoje
        </UmbrellaText>
        <AgendaTimeline events={mockTodayAgenda} />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginTop: Spacing.sm,
  },
  section: {
    gap: Spacing.lg,
  },
  moduleList: {
    gap: Spacing.lg,
  },
  agendaTitle: {
    marginBottom: Spacing.lg,
  },
});
