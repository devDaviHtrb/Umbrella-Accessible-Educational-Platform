import { useState, createElement } from 'react';
import { StyleSheet, View, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Checkbox } from '@/components/ui/checkbox';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import type { NewReminderInput } from '@/types/agenda';
import { Picker } from '@react-native-picker/picker';
import { EventType } from '@/types/schedule';

export type NewReminderFormProps = {
  onSubmit: (input: NewReminderInput) => void;
};

export default function NewReminderForm({ onSubmit }: NewReminderFormProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const [urgent, setUrgent] = useState(false);
  const [type, setType] = useState<EventType>(EventType.PERSONAL);
  const [description, setDescription] = useState('');
  const [showError, setShowError] = useState(false);

  function handleSubmit() {
    if (!title.trim()) {
      setShowError(true);
      return;
    }
    
    // Format as local ISO string for backend LocalDateTime (YYYY-MM-DDTHH:mm:ss)
    const pad = (n: number) => n.toString().padStart(2, '0');
    const localIsoString = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;

    onSubmit({
      title: title.trim(),
      date: localIsoString,
      urgent,
      type,
      description: description.trim() || undefined,
    });
  }

  const renderDateAndTime = () => {
    if (Platform.OS === 'web') {
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      
      return (
        <View style={styles.row}>
          <View style={styles.flex1}>
            <UmbrellaText variant="label" color={Colors.light.primary} style={styles.webLabel}>DATA</UmbrellaText>
            {createElement('input', {
              type: 'date',
              value: dateStr,
              onChange: (e: any) => {
                if (!e.target.value) return;
                const [year, month, day] = e.target.value.split('-');
                const newDate = new Date(date);
                newDate.setFullYear(Number(year), Number(month) - 1, Number(day));
                setDate(newDate);
              },
              style: { padding: 12, borderRadius: 8, border: 'none', backgroundColor: Colors.light.surfaceContainerLow, outline: 'none', fontFamily: 'sans-serif' }
            })}
          </View>
          <View style={[styles.flex1, styles.ml]}>
            <UmbrellaText variant="label" color={Colors.light.primary} style={styles.webLabel}>HORA</UmbrellaText>
            {createElement('input', {
              type: 'time',
              value: timeStr,
              onChange: (e: any) => {
                if (!e.target.value) return;
                const [hours, mins] = e.target.value.split(':');
                const newDate = new Date(date);
                newDate.setHours(Number(hours), Number(mins));
                setDate(newDate);
              },
              style: { padding: 12, borderRadius: 8, border: 'none', backgroundColor: Colors.light.surfaceContainerLow, outline: 'none', fontFamily: 'sans-serif' }
            })}
          </View>
        </View>
      );
    }

    return (
      <>
        <View style={styles.row}>
          <Pressable onPress={() => setShowDatePicker(true)} style={styles.flex1}>
            <TextField
              label="Data"
              placeholder="Data"
              value={date.toLocaleDateString('pt-BR')}
              editable={false}
            />
          </Pressable>
          
          <Pressable onPress={() => setShowTimePicker(true)} style={[styles.flex1, styles.ml]}>
            <TextField
              label="Hora"
              placeholder="Hora"
              value={date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              editable={false}
            />
          </Pressable>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event: any, selectedDate?: Date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={date}
            mode="time"
            display="default"
            is24Hour={true}
            onChange={(event: any, selectedDate?: Date) => {
              setShowTimePicker(Platform.OS === 'ios');
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}
      </>
    );
  };

  return (
    <View style={styles.form}>
      <TextField
        label="Título"
        placeholder="Ex: Entrega do projeto"
        value={title}
        onChangeText={(value) => {
          setTitle(value);
          setShowError(false);
        }}
      />
      
      {renderDateAndTime()}

      <Checkbox checked={urgent} onChange={setUrgent} label="Marcar como urgente" />
      <TextField
        label="Descrição"
        placeholder="Detalhes do lembrete (opcional)"
        value={description}
        onChangeText={setDescription}
      />
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={type}
          onValueChange={(itemValue: EventType) => setType(itemValue)}
        >
          {Object.values(EventType).map((et) => (
            <Picker.Item key={et} label={et} value={et} />
          ))}
        </Picker>
      </View>
      {showError && (
        <UmbrellaText variant="caption" color={Colors.light.error}>
          Preencha o título para salvar o lembrete.
        </UmbrellaText>
      )}
      <PrimaryButton label="Salvar Lembrete" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.lg,
  },
  pickerContainer: {
    marginTop: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  ml: {
    marginLeft: Spacing.sm,
  },
  webLabel: {
    marginBottom: 8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});