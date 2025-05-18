// src/hooks/useTimePicker.ts
import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ParentalSettingsData } from '../services/apiService'; // Adjust path

const formatTime = (date: Date): string => {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};

const parseTime = (timeString: string): Date => {
  const p = timeString?.split(':');
  const h = parseInt(p?.[0] ?? '0', 10);
  const m = parseInt(p?.[1] ?? '0', 10);
  const d = new Date();
  if (!isNaN(h) && !isNaN(m)) d.setHours(h, m, 0, 0);
  else d.setHours(0, 0, 0, 0);
  return d;
};

interface UseTimePickerProps {
  getStartTime: () => string; // To get current downtimeStart from localSettings
  getEndTime: () => string;   // To get current downtimeEnd from localSettings
  onTimeSelected: (target: 'downtimeStart' | 'downtimeEnd', time: string) => void;
}

export const useTimePicker = ({ getStartTime, getEndTime, onTimeSelected }: UseTimePickerProps) => {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState<'start' | 'end' | null>(null);
  const [timePickerValue, setTimePickerValue] = useState<Date>(new Date());

  const showTimePickerModal = useCallback((target: 'start' | 'end') => {
    setTimePickerTarget(target);
    const initialTime = target === 'start' ? getStartTime() : getEndTime();
    setTimePickerValue(parseTime(initialTime));
    setShowTimePicker(true);
  }, [getStartTime, getEndTime]);

  const onTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || timePickerValue;
    if (Platform.OS === 'android') {
      setShowTimePicker(false); // Always hide on Android after interaction
    }
    if (event.type === 'set' && timePickerTarget) {
      const formattedTime = formatTime(currentDate);
      onTimeSelected(timePickerTarget === 'start' ? 'downtimeStart' : 'downtimeEnd', formattedTime);
      if (Platform.OS === 'ios') setShowTimePicker(false); // Hide on iOS only on 'set'
      setTimePickerTarget(null);
    } else if (event.type === 'dismissed' || event.type === 'neutralButtonPressed') {
      setShowTimePicker(false);
      setTimePickerTarget(null);
    }
  };

  return {
    showTimePicker,
    timePickerValue,
    showTimePickerModal,
    onTimeChange,
    // No need to expose setShowTimePicker or setTimePickerTarget directly
  };
};