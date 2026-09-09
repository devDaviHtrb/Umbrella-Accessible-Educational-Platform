import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    View,
  } from 'react-native';
  import { useSafeAreaInsets } from 'react-native-safe-area-context';
  
  import { IconSymbol } from '@/components/ui/icon-symbol';
  import { UmbrellaText } from '@/components/ui/umbrella-text';
  import { Colors, Radius, Spacing } from '@/constants/theme';
  
  export type ModalSheetProps = {
    visible: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  };
  
  export function ModalSheet({ visible, onClose, title, children }: ModalSheetProps) {
    const insets = useSafeAreaInsets();
  
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fechar" />
  
          <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.header}>
              <UmbrellaText variant="headline">{title}</UmbrellaText>
              <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
                <IconSymbol name="xmark" size={20} color={Colors.light.textSecondary} />
              </Pressable>
            </View>
  
            {children}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }
  
  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(17, 24, 28, 0.45)',
    },
    sheet: {
      backgroundColor: Colors.light.surface,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      padding: Spacing.xl,
      gap: Spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  });