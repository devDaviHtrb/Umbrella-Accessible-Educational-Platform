import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, StyleSheet, View, Platform } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';

import { AccessibilityAudioCard } from '@/components/class/accessibility-audio-card';
import { ClassChatMessage } from '@/components/class/class-chat-message';
import { ClassResourceItem } from '@/components/class/class-resource-item';
import { ScreenContainer } from '@/components/layout/screen-container';
import { ChatInput } from '@/components/tutor/chat-input';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { StatusBadge } from '@/components/ui/status-badge';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import {
  mockClassEyebrow,
  mockClassProgress,
  mockClassResources,
  mockClassTitle,
  mockProfessorChatMessages,
  mockPublicChatMessages,
} from '@/constants/mock/class';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { ClassChatMessage as ClassChatMessageType, ClassChatTab } from '@/types/class';

export default function AulaDoAlunoScreen() {
  const [activeTab, setActiveTab] = useState<ClassChatTab>('public');
  const [publicMessages, setPublicMessages] = useState<ClassChatMessageType[]>(mockPublicChatMessages);
  const [professorMessages, setProfessorMessages] = useState<ClassChatMessageType[]>(
    mockProfessorChatMessages,
  );
  const [draft, setDraft] = useState('');

  const headerHeight = useHeaderHeight();

  const messages = activeTab === 'public' ? publicMessages : professorMessages;
  const setMessages = activeTab === 'public' ? setPublicMessages : setProfessorMessages;

  function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed) return;

    const newMessage: ClassChatMessageType = {
      id: `local-${Date.now()}`,
      senderName: 'Você',
      isSelf: true,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      text: trimmed,
    };
    setMessages((prev) => [...prev, newMessage]);
    setDraft('');
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, styles.containerBg]}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 110}>
      <ScreenContainer
        disableTopInset
        contentContainerStyle={styles.content}
        footer={
          <ChatInput
            value={draft}
            onChangeText={setDraft}
            onSend={handleSend}
            placeholder="Lorem ipsum..."
            showQuickActions={false}
          />
        }>
        <View>
          <UmbrellaText variant="label" color={Colors.light.primary} style={styles.eyebrow}>
            {mockClassEyebrow.toUpperCase()}
          </UmbrellaText>
          <UmbrellaText variant="title" style={styles.title}>
            {mockClassTitle}
          </UmbrellaText>
          <StatusBadge label="AO VIVO" tone="teal" />
        </View>

        <View style={styles.videoArea}>
          <View style={styles.professorBadge}>
            <IconSymbol name="person.fill" size={12} color={Colors.light.surface} />
            <UmbrellaText variant="caption" color={Colors.light.surface}>
              PROFESSOR
            </UmbrellaText>
          </View>

          <View style={styles.videoControlsRow}>
            <IconSymbol name="speaker.wave.2.fill" size={18} color={Colors.light.surface} />
            <IconSymbol name="arrow.up.left.and.arrow.down.right" size={18} color={Colors.light.surface} />
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${mockClassProgress * 100}%` }]} />
          </View>
        </View>

        <AccessibilityAudioCard />

        <View style={styles.resourcesCard}>
          <View style={styles.resourcesHeader}>
            <IconSymbol name="square.and.arrow.down" size={16} color={Colors.light.text} />
            <UmbrellaText variant="headline">Recursos</UmbrellaText>
          </View>
          <View style={styles.resourceList}>
            {mockClassResources.map((resource) => (
              <ClassResourceItem key={resource.id} resource={resource} />
            ))}
          </View>
        </View>

        <View style={styles.chatCard}>
          <View style={styles.tabRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setActiveTab('public')}
              style={[styles.tab, activeTab === 'public' && styles.tabActive]}>
              <UmbrellaText
                variant="bodyMedium"
                color={activeTab === 'public' ? Colors.light.primary : Colors.light.textSecondary}>
                Chat Público
              </UmbrellaText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setActiveTab('professor')}
              style={[styles.tab, activeTab === 'professor' && styles.tabActive]}>
              <UmbrellaText
                variant="bodyMedium"
                color={activeTab === 'professor' ? Colors.light.primary : Colors.light.textSecondary}>
                Com o Professor
              </UmbrellaText>
            </Pressable>
          </View>

          <View style={styles.messageList}>
            {messages.map((message) => (
              <ClassChatMessage key={message.id} message={message} />
            ))}
          </View>
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  containerBg: {
    backgroundColor: Colors.light.background,
  },
  content: {
    paddingBottom: Spacing.lg,
  },
  eyebrow: {
    letterSpacing: 0.4,
    marginBottom: Spacing.xs,
  },
  title: {
    marginBottom: Spacing.md,
  },
  videoArea: {
    height: 200,
    borderRadius: Radius.lg,
    backgroundColor: '#15181D',
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  professorBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  videoControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.light.primaryLight,
  },
  resourcesCard: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  resourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  resourceList: {
    gap: Spacing.md,
  },
  chatCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    shadowColor: '#0B1E4D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: Radius.pill,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
  tabActive: {
    backgroundColor: Colors.light.surface,
  },
  messageList: {
    gap: Spacing.md,
  },
});