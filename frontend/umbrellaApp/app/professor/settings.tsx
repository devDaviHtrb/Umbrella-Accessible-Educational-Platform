import { ProfessorBottomBar } from '@/components/professor/professor-bottom-bar';
import { SettingsScreen } from '@/components/settings/settings-screen';

export default function ProfessorSettingsScreen() {
  return <SettingsScreen footer={<ProfessorBottomBar active="settings" />} />;
}
