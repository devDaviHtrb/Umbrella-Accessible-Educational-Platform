import { ProfessorBottomBar } from '@/components/professor/professor-bottom-bar';
import { TutorChat } from '@/components/tutor/tutor-chat';

export default function ProfessorTutorScreen() {
  return <TutorChat statusLabel="CONVERSE COM A IA UMBRELLA" bottomBar={<ProfessorBottomBar active="tutor" />} />;
}
