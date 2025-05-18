// src/hooks/useNotifyEmailForm.ts
import { useState, useCallback } from 'react';
import { Alert, Keyboard } from 'react-native';
import { TFunction } from 'i18next';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface UseNotifyEmailFormProps {
  getNotifyEmails: () => string[];
  onEmailsChange: (emails: string[]) => void;
  t: TFunction;
}

export const useNotifyEmailForm = ({ getNotifyEmails, onEmailsChange, t }: UseNotifyEmailFormProps) => {
  const [showAddEmailInput, setShowAddEmailInput] = useState(false);
  const [newNotifyEmail, setNewNotifyEmail] = useState('');

  const toggleAddEmailInput = useCallback(() => {
    setShowAddEmailInput((prev) => {
        if(prev) Keyboard.dismiss();
        return !prev;
    });
    setNewNotifyEmail(''); // Clear input when toggling
  }, []);

  const handleAddNotifyEmail = useCallback(() => {
    const trimmedEmail = newNotifyEmail.trim();
    if (!trimmedEmail) return;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert(t('parentalControls.errors.invalidEmail')); return;
    }
    const currentEmails = getNotifyEmails();
    const lowerCaseEmail = trimmedEmail.toLowerCase();
    if (currentEmails.some((email) => email.toLowerCase() === lowerCaseEmail)) {
      Alert.alert(t('parentalControls.errors.duplicateEmail')); return;
    }
    onEmailsChange([...currentEmails, trimmedEmail]);
    setNewNotifyEmail('');
    setShowAddEmailInput(false); // Hide input after adding
    Keyboard.dismiss();
  }, [newNotifyEmail, getNotifyEmails, onEmailsChange, t]);

  const handleDeleteNotifyEmail = useCallback((emailToDelete: string) => {
    const currentEmails = getNotifyEmails();
    onEmailsChange(currentEmails.filter((email) => email !== emailToDelete));
  }, [getNotifyEmails, onEmailsChange]);

  return {
    showAddEmailInput,
    newNotifyEmail,
    setNewNotifyEmail,
    toggleAddEmailInput,
    handleAddNotifyEmail,
    handleDeleteNotifyEmail,
  };
};